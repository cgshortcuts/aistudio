import { memo } from "react";

import Logo from "../../components/Logo";
import { BORDER_RADIUS } from "../../components/ui_primitives";

/** Brand mark at the top of the desktop rail. Not a menu button. */
const RailAppLogo = memo(function RailAppLogo() {
  return (
    <div className="rail-app-logo">
      <Logo
        small
        width="40px"
        height="40px"
        fontSize="1em"
        borderRadius={BORDER_RADIUS.sm}
      />
    </div>
  );
});

RailAppLogo.displayName = "RailAppLogo";

export default RailAppLogo;
