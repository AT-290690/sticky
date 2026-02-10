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
<img width="415" height="582" alt="Screenshot 2026-02-10 at 12 33 31" src="https://github.com/user-attachments/assets/5328d53a-6278-431b-82f5-3d63532f0901" />

