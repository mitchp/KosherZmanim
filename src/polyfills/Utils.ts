import momentTimezone = require("moment-timezone");

export default class Utils {
    // https://stackoverflow.com/a/40577337/8037425
    public static getAllMethodNames(obj: object, excludeContructors: boolean = false): Array<string> {
        // let methods: Array<string> = [];
        let methods: Set<string> = new Set();

        while (obj = Reflect.getPrototypeOf(obj)) {
            let keys: Array<string> = Reflect.ownKeys(obj) as Array<string>;
            // methods = methods.concat(keys);
            keys.filter((key: string) => !methods.has(key))
                .filter((key: string) => !excludeContructors || key !== "constructor")
                .forEach((key: string) => methods.add(key));
        }

        return Array.from(methods);
    };
}

export module TimeZone {
    export function getRawOffset(timeZoneId: string): number {
        return momentTimezone.tz(timeZoneId).utcOffset();
    }

    // TODO: This will return the current DST status, as opposed to Java which returns non-DST
    export function getDisplayName(timeZoneId: string): string {
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timeZoneId,
            timeZoneName: "long"
        };
        return new Date().toLocaleDateString("en-US", options).split(",")[1].trim();
    }

    /*
    public getDSTSavings(): number {}
    */

    export function getOffset(timeZoneId: string, millisSinceEpoch: number): number {
        return momentTimezone(millisSinceEpoch).tz(timeZoneId).utcOffset() * 1000;
    }
}