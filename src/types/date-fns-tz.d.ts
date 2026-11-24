declare module "date-fns-tz" {
  export function formatInTimeZone(
    date: Date | string | number,
    timeZone: string,
    formatStr: string
  ): string;

  export function fromZonedTime(
    date: Date | string | number,
    timeZone: string
  ): Date;

  export function toZonedTime(
    date: Date | string | number,
    timeZone: string
  ): Date;
}
