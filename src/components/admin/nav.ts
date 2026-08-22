import {
  LayoutDashboard,
  Package,
  FolderTree,
  Layers,
  ShoppingCart,
  Users,
  Star,
  Tag,
  Image as ImageIcon,
  LayoutTemplate,
  Settings,
} from "lucide-react";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
  { href: "/admin/collections", label: "Collections", icon: Layers, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { href: "/admin/promotions", label: "Promotions", icon: Tag, exact: false },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon, exact: false },
  { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
];
