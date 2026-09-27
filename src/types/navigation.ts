export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  MainTabs: undefined;
  PaymentSuccess: { session_id: string; credits: string };
  PaymentCanceled: undefined;
  PaymentHistory: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Gallery: undefined;
  Account: undefined;
};
