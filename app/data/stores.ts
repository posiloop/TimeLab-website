export type Store = {
  name: string;
  image: string;
  hours: string;
  address: string;
  /** Google 地圖連結 */
  mapUrl: string;
};

export const STORES: Store[] = [
  {
    name: "台中勤美店",
    image: "/images/store/store-qinmei.png",
    hours: "11:00~23:00",
    address: "臺中市西區民龍里公益路143號",
    mapUrl: "https://maps.app.goo.gl/sKdKmJ3aquCEHLxS9",
  },
  {
    name: "台北中山店",
    image: "/images/store/store-zhongshan.png",
    hours: "10:00~23:00",
    address: "臺北市中山區中山北路二段20巷2-3號1樓",
    mapUrl: "https://maps.app.goo.gl/kwiomJb2KmDpPM6t9",
  },
];
