import { calculateShipping } from "../../services/user/checkout.service";


describe("calculate shipping",()=>{
    test("returns 99 when subtotal is below 999",()=>{
        expect(calculateShipping(90)).toBe(99)
    });

    test("return 0 when subtotal exactly 999",()=>{
        expect(calculateShipping(999)).toBe(0)
    });
     
    test("return 0 when subtotal is above 999",()=>{
        expect(calculateShipping(1500)).toBe(0)
    });

    test("returns 0 when subtotal is exactly 0",()=>{
        expect(calculateShipping(0)).toBe(0);
          });
    test("returns 0 when subtotal is below 0",()=>{
        expect(calculateShipping(-90)).toBe(0)
    })
})

