/**
 * Interface for sidebar navigation item
 */
export interface NavItem {
  title: string;
  url: string;
  isActive: boolean;
  isSelected: boolean;
  hr_uid: string | null;
  items: NavItem[];
  category: string;
}
