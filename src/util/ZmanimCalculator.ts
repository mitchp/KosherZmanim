import GeoLocation from "./GeoLocation";
import AstronomicalCalculator from "./AstronomicalCalculator";
import * as MomentTimezone from "moment-timezone";
import Moment = MomentTimezone.Moment;
import {MathUtils} from "../polyfills/Utils";

/**
 * Implementation of sunrise and sunset methods to calculate astronomical times. This implementation is a port of the
 * C++ algorithm written by Ken Bloom for the sourceforge.net <a
 * href="http://sourceforge.net/projects/zmanim/">Zmanim</a> project. Ken's algorithm is based on the US Naval Almanac
 * algorithm. Added to Ken's code is adjustment of the zenith to account for elevation. Originally released under the
 * GPL, it has been released under the LGPL as of April 8, 2010.
 * 
 * @author &copy; Chanoch (Ken) Bloom 2003 - 2004
 * @author &copy; Eliyahu Hershfeld 2004 - 2011
 * @version 1.1
 */
export default class ZmanimCalculator extends AstronomicalCalculator {
    private calculatorName: string = "US Naval Almanac Algorithm";

    /**
     * @see net.sourceforge.zmanim.util.AstronomicalCalculator#getCalculatorName()
     */
    public getCalculatorName(): string {
        return this.calculatorName;
    }

    /**
     * @see net.sourceforge.zmanim.util.AstronomicalCalculator#getUTCSunrise(Calendar, GeoLocation, double, boolean)
     */
    public getUTCSunrise(moment: Moment, geoLocation: GeoLocation, zenith: number, adjustForElevation: boolean): number {
        const elevation: number = adjustForElevation ? geoLocation.getElevation() : 0;
        const adjustedZenith: number = this.adjustZenith(zenith, elevation);

        // step 1: First calculate the day of the year
        // NOT NEEDED in this implementation

        // step 2: convert the longitude to hour value and calculate an approximate time
        const lngHour: number = geoLocation.getLongitude() / 15;

        // use 18 for sunset instead of 6
        const t: number = moment.dayOfYear() + ((6 - lngHour) / 24);

        // step 3: calculate the sun's mean anomaly
        const m: number = (0.9856 * t) - 3.289;

        // step 4: calculate the sun's true longitude
        let l: number = m + (1.916 * Math.sin(MathUtils.degreesToRadians(m))) + (0.020 * Math.sin(MathUtils.degreesToRadians(2 * m))) + 282.634;
        while (l < 0) {
            const Lx: number = l + 360;
            l = Lx;
        }
        while (l >= 360) {
            const Lx: number = l - 360;
            l = Lx;
        }

        // step 5a: calculate the sun's right ascension
        let RA: number = MathUtils.radiansToDegrees(Math.atan(0.91764 * Math.tan(MathUtils.degreesToRadians(l))));

        while (RA < 0) {
            const RAx: number = RA + 360;
            RA = RAx;
        }
        while (RA >= 360) {
            const RAx: number = RA - 360;
            RA = RAx;
        }

        // step 5b: right ascension value needs to be in the same quadrant as L
        const lQuadrant: number = Math.trunc(l / 90) * 90;
        const raQuadrant: number = Math.trunc(RA / 90) * 90;
        RA = RA + (lQuadrant - raQuadrant);

        // step 5c: right ascension value needs to be converted into hours
        RA /= 15;

        // step 6: calculate the sun's declination
        const sinDec: number = 0.39782 * Math.sin(MathUtils.degreesToRadians(l));
        const cosDec: number = Math.cos(Math.asin(sinDec));

        // step 7a: calculate the sun's local hour angle
        const cosH: number = (Math.cos(MathUtils.degreesToRadians(adjustedZenith)) - (sinDec * Math.sin(MathUtils.degreesToRadians(geoLocation
                .getLatitude())))) / (cosDec * Math.cos(MathUtils.degreesToRadians(geoLocation.getLatitude())));

        // step 7b: finish calculating H and convert into hours
        let H: number = 360 - MathUtils.radiansToDegrees(Math.acos(cosH));

        // FOR SUNSET remove "360 - " from the above

        H = H / 15;

        // step 8: calculate local mean time

        const T: number = H + RA - (0.06571 * t) - 6.622;

        // step 9: convert to UTC
        let UT: number = T - lngHour;
        while (UT < 0) {
            const UTx: number = UT + 24;
            UT = UTx;
        }
        while (UT >= 24) {
            const UTx: number = UT - 24;
            UT = UTx;
        }
        return UT;
    }

    /**
     * @see net.sourceforge.zmanim.util.AstronomicalCalculator#getUTCSunset(Calendar, GeoLocation, double, boolean)
     */
    public getUTCSunset(moment: Moment, geoLocation: GeoLocation, zenith: number, adjustForElevation: boolean): number {
        const elevation: number = adjustForElevation ? geoLocation.getElevation() : 0;
        const adjustedZenith: number = this.adjustZenith(zenith, elevation);

        // step 1: First calculate the day of the year
        const N: number = moment.dayOfYear();

        // step 2: convert the longitude to hour value and calculate an approximate time
        const lngHour: number = geoLocation.getLongitude() / 15;

        const t: number = N + ((18 - lngHour) / 24);

        // step 3: calculate the sun's mean anomaly
        const M: number = (0.9856 * t) - 3.289;

        // step 4: calculate the sun's true longitude
        let L: number = M + (1.916 * Math.sin(MathUtils.degreesToRadians(M))) + (0.020 * Math.sin(MathUtils.degreesToRadians(2 * M))) + 282.634;
        while (L < 0) {
            const Lx: number = L + 360;
            L = Lx;
        }
        while (L >= 360) {
            const Lx: number = L - 360;
            L = Lx;
        }

        // step 5a: calculate the sun's right ascension
        let RA: number = MathUtils.radiansToDegrees(Math.atan(0.91764 * Math.tan(MathUtils.degreesToRadians(L))));
        while (RA < 0) {
            const RAx: number = RA + 360;
            RA = RAx;
        }
        while (RA >= 360) {
            const RAx: number = RA - 360;
            RA = RAx;
        }

        // step 5b: right ascension value needs to be in the same quadrant as L
        const Lquadrant: number = Math.trunc(L / 90) * 90;
        const RAquadrant: number = Math.trunc(RA / 90) * 90;
        RA = RA + (Lquadrant - RAquadrant);

        // step 5c: right ascension value needs to be converted into hours
        RA /= 15;

        // step 6: calculate the sun's declination
        const sinDec: number = 0.39782 * Math.sin(MathUtils.degreesToRadians(L));
        const cosDec: number = Math.cos(Math.asin(sinDec));

        // step 7a: calculate the sun's local hour angle
        const cosH: number = (Math.cos(MathUtils.degreesToRadians(adjustedZenith)) - (sinDec * Math.sin(MathUtils.degreesToRadians(geoLocation
                .getLatitude())))) / (cosDec * Math.cos(MathUtils.degreesToRadians(geoLocation.getLatitude())));

        // step 7b: finish calculating H and convert into hours
        let H: number = MathUtils.radiansToDegrees(Math.acos(cosH));
        H = H / 15;

        // step 8: calculate local mean time

        const T: number = H + RA - (0.06571 * t) - 6.622;

        // step 9: convert to UTC
        let UT: number = T - lngHour;
        while (UT < 0) {
            const UTx: number = UT + 24;
            UT = UTx;
        }
        while (UT >= 24) {
            const UTx: number = UT - 24;
            UT = UTx;
        }
        return UT;
    }
}
