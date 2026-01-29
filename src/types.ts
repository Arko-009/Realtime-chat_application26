export type BookingFormData = {
  name: string;
  date: string;
  ships: number;
  people: number;
  pricePlan: "Basic" | "Standard" | "Premium";
  notes: string;
};

export type Message =
  | {
      type: "text";
      sender: string;
      content: string;
    }
  | {
      type: "popup";
      sender: "owner";
      data: {
        title: string;
        status: "waiting" | "submitted";
        formData?: BookingFormData;
      };
    }
  | {
      type: "confirmation";
      sender: "user";
      data: BookingFormData;
    };
