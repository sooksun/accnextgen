'use client'

import { DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import thTHLocale from 'antd/locale/th_TH'
import { toBuddhistEra, toCommonEra } from '@/lib/date-utils'
import { useEffect, useRef, useId, useCallback } from 'react'

// ตั้งค่า dayjs สำหรับ พ.ศ.
if (typeof dayjs.extend === 'function') {
  try {
    dayjs.extend(buddhistEra)
  } catch (e) {
    // ignore if already extended
  }
}

// สร้าง custom locale ที่แสดงปีเป็น พ.ศ. ใน header
const defaultDatePicker = thTHLocale.DatePicker || ({} as any)
const defaultLang = (defaultDatePicker as any).lang || {}

const buddhistLocale = {
  ...defaultDatePicker,
  lang: {
    ...defaultLang,
    // กำหนด format สำหรับแสดงปีเป็น พ.ศ. ใน header และ cells
    fieldDateFormat: 'BBBB-MM-DD',
    fieldDateTimeFormat: 'BBBB-MM-DD HH:mm:ss',
    yearFormat: 'BBBB', // สำหรับ header
    cellYearFormat: 'BBBB', // สำหรับ cells ในปี selector
    dateFormat: 'DD/MM/BBBB',
    dateTimeFormat: 'DD/MM/BBBB HH:mm:ss',
  },
}

const customLocale = {
  ...thTHLocale,
  DatePicker: buddhistLocale,
}

interface ThaiDatePickerProps {
  value?: string // วันที่ในรูปแบบ YYYY-MM-DD (ค.ศ.)
  onChange?: (value: string) => void // callback ที่ส่งค่ากลับเป็น YYYY-MM-DD (ค.ศ.)
  placeholder?: string
  className?: string
  disabled?: boolean
  allowClear?: boolean
}

export default function ThaiDatePicker({
  value,
  onChange,
  placeholder = 'เลือกวันที่',
  className = '',
  disabled = false,
  allowClear = true,
}: ThaiDatePickerProps) {
  const pickerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenersRef = useRef<Array<{ element: Element; event: string; handler: (e?: Event) => void }>>([])
  const uniqueId = useId()
  
  // แปลงค่าจาก API (ค.ศ.) เป็น dayjs (พ.ศ.) สำหรับแสดง
  const dayjsValue = value ? toBuddhistEra(value) : null

  // เมื่อเลือกวันที่ ให้แปลงกลับเป็น ค.ศ. แล้วส่งไปยัง onChange
  const handleChange = (date: Dayjs | null) => {
    if (onChange) {
      onChange(toCommonEra(date))
    }
  }

  // ฟังก์ชันสำหรับแก้ไข header text - แก้เฉพาะปุ่มที่เป็นปีเท่านั้น ไม่ทำลายโครงสร้าง DOM
  const updateThisHeaderText = useCallback(() => {
    // หา dropdown ที่เปิดอยู่
    const openDropdowns = document.querySelectorAll('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)')
    
    for (const dropdown of Array.from(openDropdowns)) {
      const rect = dropdown.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0 && rect.top >= 0) {
        const headerView = dropdown.querySelector('.ant-picker-header-view') as HTMLElement | null
        if (!headerView) continue
        
        // หาปุ่มที่เป็นปี และแก้เฉพาะปุ่มนั้นเท่านั้น
        headerView.querySelectorAll('button').forEach((btn) => {
          const text = (btn.textContent || '').trim()
          const match = text.match(/^(19\d{2}|20\d{2})$/)
          if (!match) return
          
          const yearAD = parseInt(match[1], 10)
          if (yearAD < 1900 || yearAD > 2099) return
          
          // แก้เฉพาะ textContent ของปุ่มนี้เท่านั้น ไม่ทำลายโครงสร้าง
          const yearBE = yearAD + 543
          btn.textContent = String(yearBE)
        })
      }
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      eventListenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
      eventListenersRef.current = []
    }
  }, [])

  // เมื่อเปิด calendar - ใช้ useLayoutEffect เพื่อให้ทำงานก่อน paint
  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      // Cleanup ก่อน
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      eventListenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
      eventListenersRef.current = []

      // รอ DOM render แล้วตั้งค่า observers
      setTimeout(() => {
        // อัปเดต header ทันที
        updateThisHeaderText()
        
        // หา panel และ header
        const findPanelAndHeader = () => {
          const openDropdowns = document.querySelectorAll('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)')
          for (const dropdown of Array.from(openDropdowns)) {
            const rect = dropdown.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0 && rect.top >= 0) {
              const panel = dropdown.querySelector('.ant-picker-panel')
              const header = dropdown.querySelector('.ant-picker-header')
              if (panel && header) return { panel, header, dropdown }
            }
          }
          return null
        }
        
        const elements = findPanelAndHeader()
        if (elements) {
          const { panel, header } = elements
          
          // MutationObserver - ใช้แบบเบา ๆ
          const observer = new MutationObserver(() => {
            // อัปเดตเมื่อมีการเปลี่ยนแปลง DOM
            updateThisHeaderText()
          })
          observerRef.current = observer
          
          observer.observe(panel, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: false,
          })
          
          observer.observe(header, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: false,
          })
          
          const headerView = header.querySelector('.ant-picker-header-view') as HTMLElement
          if (headerView) {
            observer.observe(headerView, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: false,
            })
            
          }
          
          // Event listeners สำหรับปุ่ม - ใช้วิธีที่แน่นอนกว่า
          const attachNavigationListeners = () => {
            const superPrevBtn = header.querySelector('.ant-picker-header-super-prev-btn')
            const superNextBtn = header.querySelector('.ant-picker-header-super-next-btn')
            const prevBtn = header.querySelector('.ant-picker-header-prev-btn')
            const nextBtn = header.querySelector('.ant-picker-header-next-btn')
            
            const handleNavigation = (e?: Event) => {
              // ไม่ใช้ stopPropagation - ให้ Ant Design ทำงานปกติก่อน
              // แล้วค่อยอัปเดต header หลัง Ant Design render เสร็จ
              
              // อัปเดตหลังจาก Ant Design render เสร็จ
              setTimeout(() => {
                updateThisHeaderText()
              }, 50)
            }
            
            // ใช้ bubbling phase (default) เพื่อไม่ให้รบกวน Ant Design
            if (superPrevBtn) {
              superPrevBtn.addEventListener('click', handleNavigation, { passive: true })
              eventListenersRef.current.push({ element: superPrevBtn, event: 'click', handler: handleNavigation })
            }
            if (superNextBtn) {
              superNextBtn.addEventListener('click', handleNavigation, { passive: true })
              eventListenersRef.current.push({ element: superNextBtn, event: 'click', handler: handleNavigation })
            }
            if (prevBtn) {
              prevBtn.addEventListener('click', handleNavigation, { passive: true })
              eventListenersRef.current.push({ element: prevBtn, event: 'click', handler: handleNavigation })
            }
            if (nextBtn) {
              nextBtn.addEventListener('click', handleNavigation, { passive: true })
              eventListenersRef.current.push({ element: nextBtn, event: 'click', handler: handleNavigation })
            }
          }
          
          // Attach listeners ทันที
          attachNavigationListeners()
          
          // Attach อีกครั้งหลังจาก delay เพื่อให้แน่ใจ
          setTimeout(() => {
            attachNavigationListeners()
          }, 200)
        }
        
        // Interval สำหรับ watch ตลอดเวลา - ใช้เวลาไม่ถี่เกินไป
        intervalRef.current = setInterval(() => {
          updateThisHeaderText()
        }, 100)
      })
    } else {
      // Cleanup เมื่อปิด
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      eventListenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
      })
      eventListenersRef.current = []
    }
  }, [updateThisHeaderText])

  return (
    <div ref={containerRef} data-picker-id={uniqueId}>
      <DatePicker
        ref={pickerRef}
        value={dayjsValue}
        onChange={handleChange}
        placeholder={placeholder}
        locale={customLocale as any}
        format="DD/MM/BBBB"
        className={className}
        disabled={disabled}
        allowClear={allowClear}
        style={{ width: '100%' }}
        onOpenChange={handleOpenChange}
        onPanelChange={(value, mode) => {
          // อัปเดตเมื่อเปลี่ยน panel (เดือน/ปี)
          setTimeout(() => {
            updateThisHeaderText()
          }, 50)
        }}
      />
    </div>
  )
}
