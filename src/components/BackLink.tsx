import type { MouseEvent } from "react";
import { Link, type LinkProps } from "react-router-dom";

function isPlainNavigationClick(
  event: MouseEvent<HTMLAnchorElement>,
  target?: string
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    (!target || target === "_self") &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

export default function BackLink({ onClick, target, ...props }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (isPlainNavigationClick(event, target)) {
      window.scrollTo(0, 0);
    }
  };

  return <Link {...props} target={target} onClick={handleClick} />;
}
