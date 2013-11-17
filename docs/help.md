npmd [cmd] {options}

npmd --sync --verbose?                  # sync registry.

npmd install [module(@version)?,...]    # install modules
  --global?                             #   install globally
  --greedy?                             #   install deduped by default

npmd link [module(@version)?,...]       # install by symlink (fast)
  --global?                             #   install globally

npmd search [$term,... ]                # search npmd local index
  --results                             # number of results to display
                                        # (by default, display just enough to fit in screen)
  --show-rank                           # show the search ranking
  --show-readme                         # show matches from readme

(see the code for configuring search weightings)

npmd resolve [module(@version)?,...]    # output dependency tree for install
  --greedy?

npmd lresolve [module(@version)?,...]   # output dependency tree for link

npmd packages prefix?                   # output modules starting with prefix

npmd versions modulename                # output versions of modulesname

npmd readme modluename                  # output readme of modulename

npmd dependents   [$modulename1,...]    # output modules that depend on modules

npmd publish                            # publish locally (installable)

npmd queue                              # show queued publishes

npmd queue sync                         # push queued publishes to the npm registry.

npmd authors $name-prefix?              # display npm authors

npmd help                               # display this message
