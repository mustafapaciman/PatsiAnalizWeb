import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getTeamLogo } from '../utils/teamLogoLoader';
const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";
export const TeamLogo = ({ name, className = '', teamData, showName = false }) => {
    const logoUrl = getTeamLogo(name);
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsx("img", { src: logoUrl || EMPTY_LOGO, alt: `${name} logo`, className: `inline-block object-contain ${className}`, style: {
                    imageRendering: '-webkit-optimize-contrast',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                    WebkitFontSmoothing: 'subpixel-antialiased'
                }, onError: (e) => {
                    e.target.src = EMPTY_LOGO;
                } }), showName && (_jsx("span", { className: "text-xs text-gray-600 text-center max-w-[80px] truncate", title: name, children: name }))] }));
};
