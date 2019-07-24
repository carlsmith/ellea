# Santa Ellea: Rulebook

Santa Ellea is inspired by Settlers of Catan, but is its own game, with its
own rules, described below.

The basic idea is to build walls that allow you to access and control more of
the world. You then build forts along your walls, which allows you to gather
resources from adjacent tiles. If your wall runs along the coast, you can
also build harbors that allow you to access better prices when trading
resources. Harbors can be upgraded to ports, which further lower the
costs.

## Terminology

* Point: A synonym for *vertex* (the corners of the hextiles).
* Road: A synonym for *edge* (the lines connecting the vertices).
* Hextile (tile): The hexagonal tile sprites that fill the background.
* Control: Forts (which are always built on points) *control* the three
  tiles adjacent to the fort.

The island is made from nineteen hexagonal tiles of six types:

* Desert x 1: Unproductive null tile.
* Pasture x 3: Produces the *WoolResource*.
* Mountain x 3: Produces the *Iron Resource*.
* Meadow x 3: Produces the *Wood Resource*.
* Quarry x 4: Produces the *Bricks Resource*.
* Cornfield x 5: Produces the *Corn Resource*.

Note the five resource types (*Wood*, *Bricks*, *Wool*, *Corn* and *Iron*).

The island is surrounded by sea tiles:

* Shallow Sea: Unproductive, but can host harbors and ports.
* Deep Sea: Unproductive tiles outside of the playable area.

## Shores, Harbors & Ports

A player can establish a harbor in any unoccupied Shallow Sea tile that is
adjacent to that player's wall. The harbor's jetty runs along the player's
wall, connecting the sea tile to the land tile on the other side of the
wall.

Owning a harbor (or port) allows the player to trade the resource produced
by the land tile for the resource that the harbor (or port) specializes in,
or any resource if the harbor (or port) is despecialized.

## Resources

The availability of a given resource is generally a factor of the number of
tiles that produce that resource. Its value is also a factor of its uses,
and their utility:


Wool    3   2
Iron    3   2
Wood    3   2
Bricks  4   3
Corn    5   4

## Prices

* Wall: [Bricks] [Corn]
* Fort: [Bricks] [Wood] [Iron] [Wool] [Corn]
* Harbor: [Wood] [Iron] [Corn] [2Special]
* Port Upgrade: [Bricks] [Wool] [Corn]
* Respecialize: [2Special]
* Despecialize: [Set]
