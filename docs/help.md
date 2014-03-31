npmd [cmd] {options}

npmd install [module(@version)?,...]    # install modules
  --global?                             #   install globally
  --greedy?                             #   install deduped by default

npmd resolve [module(@version)?,...]    # output dependency tree for install
  --greedy?

npmd tree                               # view current dependency tree

npmd help                               # display this message
