export type QR =
  | {
      type: 'wifi';
      encryption: 'WPA' | 'WEP';
      name: string;
      password: string;
    }
  | {
      type: 'url';
      name: string;
      url: string;
    };
