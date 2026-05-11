export type RestrictionType = "CTS" | "CTA" | "CTD" | "MinSA" | "MinST" | "MaxSA" | "MaxST";

export type RestrictionDef = {
  key: RestrictionType;
  label: string;
  hasValue: boolean;
};

export type GuidelineRule = {
  id: string;
  name: string;
  hotelGroup: string;
  segment: string;
  roomType: string;
  restrictions: { type: RestrictionType; value?: number }[];
  stayDate: string;
  criteria: string;
  created: string;
  active: boolean;
};
