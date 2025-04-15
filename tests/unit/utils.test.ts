import { convertHumanReadableTimeToMilliseconds } from "../../src/lib/utils";

describe("Validates the functionality of the timestring to milliseconds converter function", function () {
    it("converts a string to milliseconds", function () {
        const timeInMilliseconds = convertHumanReadableTimeToMilliseconds("90d");

        expect(timeInMilliseconds).toEqual(90 * 24 * 60 * 60 * 1000);
        expect(timeInMilliseconds).toEqual(7776000000); // 90 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
    });
});
