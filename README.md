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
(let S (|> 
  INPUT 
  (String->Vector nl)
  (map 
    (comp 
      (split ": ") 
      last
      (drop/first 1)
      (String->Integer)))
  sum))

(cons "$" (Integer->String S))
```
<img width="415" height="582" alt="Screenshot 2026-02-10 at 12 26 11" src="https://github.com/user-attachments/assets/fa71ff75-d190-4b01-babc-b9a40a48027b" />
