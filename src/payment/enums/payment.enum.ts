export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  QI_CARD = 'qi_card',
  // Future payment methods can be added here
  // ZAIN_CASH = 'zain_cash',
  // PAYPAL = 'paypal',
}

export enum ServiceType {
  AGENT_TOP_UP = 'agent_top_up',
  USER_ACTIVATION = 'user_activation',
}
