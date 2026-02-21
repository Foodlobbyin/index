const GSTN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export class GstnService {
  validate(gstn: string): boolean {
    return GSTN_REGEX.test(gstn);
  }

  assertValid(gstn: string): void {
    if (!this.validate(gstn)) {
      throw new Error(`Invalid GSTN format: ${gstn}`);
    }
  }
}

export default new GstnService();
