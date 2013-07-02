

module.exports = function (funs) {
  if(!Array.isArray(funs))
    funs = [].slice.call(arguments)

  return function () {
    var args = [].slice.call(arguments)
    var called
    for(var i in funs) {
      if(called = funs[i].apply(null, args))
        break;
    }
    return called
  }
}
