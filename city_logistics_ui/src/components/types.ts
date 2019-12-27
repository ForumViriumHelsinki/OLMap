import {Address} from "util_components/types";

export type User = {
    is_courier: boolean,
    username: string,
    first_name: string,
    last_name: string,
    phone_numbers: string[]
};

export type Package = {
    picked_up_time: string,
    delivered_time: string,
    pickup_at: Address,
    deliver_to: Address
}