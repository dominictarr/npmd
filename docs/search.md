# npmd search [term, ...]

seach from multiple terms in local npmd index.

npmd indexes module names, descriptions, keywords, and readme contents.
when you search for multiple terms, results will match all terms.

All command line options may also be set as configuration options
as per [rc](https://github.com/dominictarr/rc) (in ~/.npmdrc)

## option (default)

### --results (process.stdout.rows)

Limit the number of results. By default, if stdout is a TTY,
results will be limited to the number of rows on the console.
If stdout is not a TTY, all results will be output.

### --show-rank (false)

show the numeric ranking of each result

### --show-readme (true)

show the context where query matches the readme.

## search weights

`npmd` weights results by the following weightings

```
searchWeightName        = 0.5
searchWeightDescription = 2
searchWeightStddev      = 1
searchWeightAvg         = 0.2
searchWeightGroup       = 1
```

Rankings closer to zero appear first.
(use `--show-rank` when tuning search weights)
