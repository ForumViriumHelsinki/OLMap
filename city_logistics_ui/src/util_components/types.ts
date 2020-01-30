export type Location = {
    lat: number,
    lon: number
}

export type Address = Location & {
    street_address: string,
    postal_code: string,
    city: string,
    country: string
}

export type LocationTuple = [number, number] | number[]

export type OSMFeature = {
    type: "node" | "way" | "relation",
    id: number,
    lat: number,
    lon: number,
    tags: { [tag: string]: string }
}