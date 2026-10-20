import * as React from 'react';
import { useBlocker } from 'react-router';
import { Button, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

/**
 * 有未保存改动时拦截离开（点侧栏、面包屑、取消、浏览器后退），弹出确认。
 *
 *   const guard = useUnsavedGuard(isDirty);
 *   ...{guard.dialog}
 *   提交成功后：guard.leave(() => navigate('/queries'));   // 放行这一次跳转
 */
export function useUnsavedGuard(when: boolean) {
  const skip = React.useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !skip.current && when && currentLocation.pathname !== nextLocation.pathname);
  const open = blocker.state === 'blocked';
  const dialog = (
    <Dialog open={open} onOpenChange={(o) => !o && blocker.reset?.()}>
      <DialogContent size="sm">
        <DialogHeader tone="warning"><DialogTitle>放弃未保存的修改？</DialogTitle></DialogHeader>
        <DialogBody indent>离开后，这个页面上的修改将不会保存。</DialogBody>
        <DialogFooter>
          <Button onClick={() => blocker.reset?.()}>继续编辑</Button>
          <Button variant="destructive" onClick={() => blocker.proceed?.()}>放弃修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  const leave = React.useCallback((go: () => void) => { skip.current = true; go(); }, []);
  return { dialog, leave };
}

/** 只需要拦截、不需要主动放行时的简写（如设置页）。 */
export function UnsavedGuard({ when }: { when: boolean }) {
  return useUnsavedGuard(when).dialog;
}
