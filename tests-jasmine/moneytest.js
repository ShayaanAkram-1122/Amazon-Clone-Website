import { formatCurrency }from "../scripts/utils/money.js";

describe('test suite: formatCurrency',()=>
{
    it('Converts Cents into Dollars',()=>
    {
        expect(formatCurrency(2095)).toEqual('20.95');
    });
    it('rounds up to the nearest cent ',()=>
    {
        expect(formatCurrency(2000.5)).toEqual('20.01');
    })
});

