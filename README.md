# final-approach-2


## Physics

### Props
```
    Props:'
        massKG - aircraft mass in KG
        horizontalVMS - current aircraft speed, position delta X
        verticalVMS - current vertical speed, position delta Y
        stallMS -  minimum horizontalVMS required to stay in a
                    controlled decent
        stallMaxVerticalVMS - terminal velocity for a negative
                               attutude stalling plane
        stallNegHAccelerationMS - rate at which a stalled aircraft
                                will accelerate until stallMaxVerticalVMS
        climbMinMS - minimum horizontalVMS required for a positive
                    verticalVMS if attitude is positive
```

### Knots and Meters / Second

```
knots / 2 = meters-per-second
knots = meters-per-second * 2
```
