export interface IOrderChart {
  count: number;
  status:
    | "waiting"
    | "ready"
    | "on the way"
    | "delivered"
    | "could not be delivered";
}

export interface ISalesChart {
  date: string;
  title: "Order Count" | "Order Amount";
  value: number;
}

export interface IOrderStatus {
  id: number;
  text: "Pending" | "Ready" | "On The Way" | "Delivered" | "Cancelled";
}

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  gsm: string;
  createdAt: string;
  isActive: boolean;
  avatar: IFile[];
  addresses: IAddress[];
}

export interface IIdentity {
  id: number;
  name: string;
  avatar: string;
  email?: string;
  role?: string;
  workshopId?: number;
  workshopName?: string;
  workshopSlug?: string;
  workshopLogoUrl?: string;
  workshopSidebarImageUrl?: string;
}

export interface IAddress {
  text: string;
  coordinate: [string | number, string | number];
}

export interface IFile {
  lastModified?: number;
  name: string;
  percent?: number;
  size: number;
  status?: "error" | "success" | "done" | "uploading" | "removed";
  type: string;
  uid?: string;
  url: string;
}

export interface IEvent {
  date: string;
  status: string;
}

export interface IStore {
  id: number;
  gsm: string;
  email: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  address: IAddress;
  products: IProduct[];
}

export interface IOrder {
  id: number;
  user: IUser;
  createdAt: string;
  products: IProduct[];
  status: IOrderStatus;
  adress: IAddress;
  store: IStore;
  courier: ICourier;
  events: IEvent[];
  orderNumber: number;
  amount: number;
}

export interface IProduct {
  id: number;
  name: string;
  isActive: boolean;
  description: string;
  images: (IFile & { thumbnailUrl?: string })[];
  createdAt: string;
  price: number;
  category: ICategory;
  stock: number;
}

export interface ICategory {
  id: number;
  title: string;
  isActive: boolean;
}

export interface ICourierStatus {
  id: number;
  text: "Available" | "Offline" | "On delivery";
}

export interface ICourier {
  id: number;
  name: string;
  surname: string;
  email: string;
  gender: string;
  gsm: string;
  createdAt: string;
  accountNumber: string;
  licensePlate: string;
  address: string;
  avatar: IFile[];
  store: IStore;
  status: ICourierStatus;
  vehicle: IVehicle;
}

export type IVehicle = {
  model: string;
  vehicleType: string;
  engineSize: number;
  color: string;
  year: number;
  id: number;
};

export type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
  document: string;
  birthDate: string;
  vehicleModel: string;
  vehicleBrand: string;
  vehiclePlate: string;
  vehicleChassisNumber: string;
  vehicleMileage: number;
  vehicleYear: number;
  vehicleColor: string;
  address: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  notes: string;
  status: "active" | "inactive";
};

export type CompanyBannerProps = {
  logoSrc?: string;
  logoAlt?: string;
  title?: string;
  subtitle?: string;
};

export type Props = {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  cardHeaderProps?: CardHeaderProps;
  cardContentProps?: CardContentProps;
} & CardProps;

export type LoginFormState = {
  workshopSlug: string;
  email: string;
  password: string;
};

export type RegisterFormState = {
  workshopName: string;
  workshopSlug: string;
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type PasswordVisibilityState = {
  login: boolean;
  register: boolean;
  confirm: boolean;
};

export type AuthMode = "login" | "register";

export type CorporateAuthPageProps = {
  type: AuthMode;
  formProps?: AuthProps["formProps"];
};

export type HighlightItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export type DateFilter = "lastWeek" | "lastMonth";

export type DashboardMetric = {
  data: ISalesChart[];
  total: number;
  trend: number;
};

export type OverviewStat = {
  label: string;
  value: string;
  color: "default" | "success" | "warning" | "error";
};

export type SchedulingFormState = {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleModel: string;
  vehiclePlate: string;
  laborCatalogItemId: string;
  serviceType: string;
  mechanicResponsible: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes: string;
};

export type PartItem = {
  id: string;
  catalogItemId?: string;
  partCondition?: ServiceOrderPartCondition;
  description: string;
  quantity: number;
  unitPrice: number;
  status: ServiceOrderPartStatus;
};

export type ServiceItem = {
  id: string;
  catalogItemId?: string;
  description: string;
  amount: number;
  costPrice?: number;
  profitAmount?: number;
  status: ServiceOrderPartStatus;
};

export type OrderInfo = {
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
  vehicle: string;
  year: string;
  plate: string;
  km: string;
  mechanicResponsible: string;
  paymentMethod: string;
  notes: string;
};

export type ChecklistState = Record<string, boolean>;

export type HistoryRow = ServiceOrderRecord & {
  status: ServiceOrderRecordStatus;
  signatureText: string;
};
