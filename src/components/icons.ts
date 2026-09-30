import { createElement, forwardRef, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The icons this app uses, inlined so dev mode doesn't pre-bundle a
 * 1,900-icon library. Path data is from Lucide (https://lucide.dev), ISC
 * License, Copyright (c) Lucide Contributors.
 *
 * To add an icon: find it on lucide.dev, copy the child elements of its SVG
 * into a new `icon("name", [...])` line, and keep this list sorted.
 */

type IconNode = [tag: string, attrs: Record<string, string>][];

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string };
export type IconComponent = ReturnType<typeof icon>;

function icon(name: string, nodes: IconNode) {
  const Component = forwardRef<SVGSVGElement, IconProps>(({ size = 24, strokeWidth = 2, className, children, ...props }, ref) =>
    createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: cn("lucide", `lucide-${name}`, className),
        ...(props["aria-label"] || props.role ? {} : { "aria-hidden": true }),
        ...props,
      },
      ...nodes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
      children,
    ),
  );
  Component.displayName = name;
  return Component;
}

export const AlertTriangle = icon("triangle-alert", [["path",{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{"d":"M12 9v4"}],["path",{"d":"M12 17h.01"}]]);
export const ArrowLeft = icon("arrow-left", [["path",{"d":"m12 19-7-7 7-7"}],["path",{"d":"M19 12H5"}]]);
export const ArrowRight = icon("arrow-right", [["path",{"d":"M5 12h14"}],["path",{"d":"m12 5 7 7-7 7"}]]);
export const Check = icon("check", [["path",{"d":"M20 6 9 17l-5-5"}]]);
export const CheckCircle2 = icon("circle-check", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m9 12 2 2 4-4"}]]);
export const ChevronDown = icon("chevron-down", [["path",{"d":"m6 9 6 6 6-6"}]]);
export const ChevronLeft = icon("chevron-left", [["path",{"d":"m15 18-6-6 6-6"}]]);
export const ChevronRight = icon("chevron-right", [["path",{"d":"m9 18 6-6-6-6"}]]);
export const ChevronUp = icon("chevron-up", [["path",{"d":"m18 15-6-6-6 6"}]]);
export const Circle = icon("circle", [["circle",{"cx":"12","cy":"12","r":"10"}]]);
export const Compass = icon("compass", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"}]]);
export const Database = icon("database", [["ellipse",{"cx":"12","cy":"5","rx":"9","ry":"3"}],["path",{"d":"M3 5V19A9 3 0 0 0 21 19V5"}],["path",{"d":"M3 12A9 3 0 0 0 21 12"}]]);
export const DatabaseZap = icon("database-zap", [["ellipse",{"cx":"12","cy":"5","rx":"9","ry":"3"}],["path",{"d":"M3 5V19A9 3 0 0 0 15 21.84"}],["path",{"d":"M21 5V8"}],["path",{"d":"M21 12L18 17H22L19 22"}],["path",{"d":"M3 12A9 3 0 0 0 14.59 14.87"}]]);
export const Inbox = icon("inbox", [["polyline",{"points":"22 12 16 12 14 15 10 15 8 12 2 12"}],["path",{"d":"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"}]]);
export const LayoutDashboard = icon("layout-dashboard", [["rect",{"width":"7","height":"9","x":"3","y":"3","rx":"1"}],["rect",{"width":"7","height":"5","x":"14","y":"3","rx":"1"}],["rect",{"width":"7","height":"9","x":"14","y":"12","rx":"1"}],["rect",{"width":"7","height":"5","x":"3","y":"16","rx":"1"}]]);
export const List = icon("list", [["path",{"d":"M3 5h.01"}],["path",{"d":"M3 12h.01"}],["path",{"d":"M3 19h.01"}],["path",{"d":"M8 5h13"}],["path",{"d":"M8 12h13"}],["path",{"d":"M8 19h13"}]]);
export const Loader2Icon = icon("loader-circle", [["path",{"d":"M21 12a9 9 0 1 1-6.219-8.56"}]]);
export const Lock = icon("lock", [["rect",{"width":"18","height":"11","x":"3","y":"11","rx":"2","ry":"2"}],["path",{"d":"M7 11V7a5 5 0 0 1 10 0v4"}]]);
export const LogOut = icon("log-out", [["path",{"d":"m16 17 5-5-5-5"}],["path",{"d":"M21 12H9"}],["path",{"d":"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}]]);
export const Menu = icon("menu", [["path",{"d":"M4 5h16"}],["path",{"d":"M4 12h16"}],["path",{"d":"M4 19h16"}]]);
export const Moon = icon("moon", [["path",{"d":"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"}]]);
export const Plus = icon("plus", [["path",{"d":"M5 12h14"}],["path",{"d":"M12 5v14"}]]);
export const Search = icon("search", [["path",{"d":"m21 21-4.34-4.34"}],["circle",{"cx":"11","cy":"11","r":"8"}]]);
export const SearchX = icon("search-x", [["path",{"d":"m13.5 8.5-5 5"}],["path",{"d":"m8.5 8.5 5 5"}],["circle",{"cx":"11","cy":"11","r":"8"}],["path",{"d":"m21 21-4.3-4.3"}]]);
export const Send = icon("send", [["path",{"d":"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}],["path",{"d":"m21.854 2.147-10.94 10.939"}]]);
export const Settings = icon("settings", [["path",{"d":"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"}],["circle",{"cx":"12","cy":"12","r":"3"}]]);
export const Sun = icon("sun", [["circle",{"cx":"12","cy":"12","r":"4"}],["path",{"d":"M12 2v2"}],["path",{"d":"M12 20v2"}],["path",{"d":"m4.93 4.93 1.41 1.41"}],["path",{"d":"m17.66 17.66 1.41 1.41"}],["path",{"d":"M2 12h2"}],["path",{"d":"M20 12h2"}],["path",{"d":"m6.34 17.66-1.41 1.41"}],["path",{"d":"m19.07 4.93-1.41 1.41"}]]);
export const Ticket = icon("ticket", [["path",{"d":"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"}],["path",{"d":"M13 5v2"}],["path",{"d":"M13 17v2"}],["path",{"d":"M13 11v2"}]]);
export const Users = icon("users", [["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["path",{"d":"M16 3.128a4 4 0 0 1 0 7.744"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["circle",{"cx":"9","cy":"7","r":"4"}]]);
export const X = icon("x", [["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]]);
export const XCircle = icon("circle-x", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m15 9-6 6"}],["path",{"d":"m9 9 6 6"}]]);
