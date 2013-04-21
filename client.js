
var reconnect  = require('reconnect')
var multilevel = require('multilevel')
var manifest   = require('./manifest.json')
var h          = require('hyperscript')

var db
reconnect(function (stream) {
  console.log('CONNECT')
  db = multilevel.client(manifest)
  stream.pipe(db).pipe(stream)
}).connect('/multilevel')

var results = h('div')

function render (d) {
  return h('div',
    h('h2', d.maintainers[0].name, '/', d.name),
    h('p', d.description)
  )
}
var qs 
document.body.appendChild(
  h('div', 
    h('h1', 'npmd'),
    h('input', {onkeydown: function (e) {
      if(qs) qs.destroy()
      results.innerHTML = ''
      var query = this.value.split(' ')
      if(db && e.keyCode === 13) { //enter
        ;(qs = db.sublevel('index')
        .createQueryStream(query, {tail: true}))
          .on('data', function (d) {
            console.log(d)
            results.appendChild(render(d.value))
          })

        }

      }, placeholder: 'search modules'}),
    results
  )
)

