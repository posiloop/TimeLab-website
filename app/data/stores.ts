export type Store = {
  name: string;
  image: string;
  hours: string;
  address: string;
};

export const STORES: Store[] = [
  {
    name: "勤美店",
    image: "/images/store/store-qinmei.png",
    hours: "11：00 - 23：00",
    address: "臺中市西區公益路143號",
  },
  {
    name: "中山店",
    image: "/images/store/store-zhongshan.png",
    hours: "10：00 - 23：00",
    address: "臺北市中山區中山北路\n二段20巷2-3號1樓",
  },
];
