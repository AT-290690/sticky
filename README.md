# sticky

Programmable Sticky Notes

```
Buy Milk: $5
Buy Protein: $100
Pay Rent: $800
Buy Food: $1500
Gym: $100
```

```lisp
(let EXPENSES (|>
  INPUT
  (String->Vector nl)
  (map
    (comp
      (split ": ")
      last
      (drop/first 1)
      String->Integer))
  sum))

(cons "$" (Integer->String EXPENSES))
```
<img width="381" height="587" alt="Screenshot 2026-02-10 at 17 04 05" src="https://github.com/user-attachments/assets/c63df28a-f9fb-453b-8bc6-d492a9c80b07" />
