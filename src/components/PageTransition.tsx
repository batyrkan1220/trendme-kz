import { useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { SwitchTransition, CSSTransition } from "react-transition-group";

export function PageTransition() {
  const location = useLocation();
  const currentOutlet = useOutlet();
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={location.pathname}
        nodeRef={nodeRef}
        timeout={200}
        classNames="page"
        unmountOnExit
      >
        <div ref={nodeRef} className="page-transition">
          {currentOutlet}
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}
