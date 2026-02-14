"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

type ConfirmResolve = (value: boolean) => void;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const confirmFn = useContext(ConfirmContext);
  if (!confirmFn) {
    return (options: ConfirmOptions) => {
      const ok = window.confirm(options.message);
      return Promise.resolve(ok);
    };
  }
  return confirmFn;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolveRef, setResolveRef] = useState<ConfirmResolve | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && resolveRef) {
        resolveRef(false);
        setResolveRef(null);
      }
      setOpen(open);
    },
    [resolveRef]
  );

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
    setResolveRef(null);
    setOpen(false);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setResolveRef(null);
    setOpen(false);
  }, [resolveRef]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <AlertDialog.Title className="text-lg font-semibold text-slate-900">
              {options.title ?? "ยืนยัน"}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
              {options.message}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  {options.cancelLabel ?? "ยกเลิก"}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant={options.variant === "danger" ? "destructive" : "default"}
                  onClick={handleConfirm}
                >
                  {options.confirmLabel ?? "ตกลง"}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}
