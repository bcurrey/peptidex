import { PointerEvent, useRef } from "react";

export function useLongPress(onLongPress: () => void, delay = 650) {
  const timer = useRef<number>();
  const fired = useRef(false);

  const start = () => {
    fired.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, delay);
  };

  const cancel = () => {
    window.clearTimeout(timer.current);
  };

  const suppressClickAfterLongPress = (event: PointerEvent<HTMLElement>) => {
    if (fired.current) {
      event.preventDefault();
      event.stopPropagation();
      fired.current = false;
    }
  };

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClickCapture: suppressClickAfterLongPress,
  };
}
