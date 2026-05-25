export interface QuotedStruct {
  messageId?: string;
  participant?: string;
}

export interface SendText {
  number: string;
  text: string;
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface SendLink {
  number: string;
  text: string;
  title?: string;
  url?: string;
  description?: string;
  imgUrl?: string;
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface SendMedia {
  number: string;
  url?: string;
  media?: File;
  type: "image" | "video" | "audio" | "document" | "ptv";
  caption?: string;
  filename?: string;
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface SendPoll {
  number: string;
  question: string;
  maxAnswer?: number;
  options: string[];
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface SendSticker {
  number: string;
  sticker: string;
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface SendLocation {
  number: string;
  name?: string;
  latitude: number;
  longitude: number;
  address?: string;
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface VCardStruct {
  fullName: string;
  organization?: string;
  phone: string;
}

export interface SendContact {
  number: string;
  vcard: VCardStruct;
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface Button {
  type: "reply" | "copy" | "url" | "call" | "pix";
  displayText: string;
  id?: string;
  copyCode?: string;
  url?: string;
  phoneNumber?: string;
  currency?: string;
  name?: string;
  keyType?: string;
  key?: string;
}

export interface SendButton {
  number: string;
  title: string;
  description: string;
  footer: string;
  buttons: Button[];
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface Row {
  title: string;
  description?: string;
  rowId?: string;
}

export interface Section {
  title?: string;
  rows: Row[];
}

export interface SendList {
  number: string;
  title: string;
  description: string;
  buttonText?: string;
  footerText: string;
  sections: Section[];
  delay?: number;
  mentionedJid?: string[];
  mentionAll?: boolean;
  formatJid?: boolean;
  quoted?: QuotedStruct;
}

export interface CarouselButton {
  type: "REPLY" | "URL" | "CALL" | "COPY";
  displayText: string;
  id?: string;
  copyCode?: string;
}

export interface CarouselCardHeader {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface CarouselCardBody {
  text: string;
}

export interface CarouselCard {
  header: CarouselCardHeader;
  body: CarouselCardBody;
  footer?: string;
  buttons?: CarouselButton[];
}

export interface SendCarousel {
  number: string;
  body?: string;
  footer?: string;
  delay?: number;
  formatJid?: boolean;
  quoted?: QuotedStruct;
  cards: CarouselCard[];
}

export interface SendStatusText {
  text: string;
  bgColor?: string;
  font?: number;
}

export interface SendStatusMedia {
  type: "image" | "video";
  url?: string;
  media?: File;
  caption?: string;
}
