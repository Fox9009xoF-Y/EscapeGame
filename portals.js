'use strict';

globalThis.PortalSystem = (() => {
  const support = (player, vector) => Math.abs(vector.x) * player.halfWidth + Math.abs(vector.y) * player.halfHeight;
  const distance = (player, door) => (player.x - door.innerCenter.x) * door.normal.x + (player.y - door.innerCenter.y) * door.normal.y;

  class Controller {
    constructor(maps) { this.maps = maps; this.blocked = null; }

    update(session) {
      const { player, input } = session;
      const direction = input.direction(), room = this.maps.currentMap;
      const idle = direction.x === 0 && direction.y === 0;
      const arrival = room.portals.find(door => door.id === this.blocked);
      if (arrival && (idle || distance(player, arrival) > support(player, arrival.normal) + 36)) this.blocked = null;
      if (idle) return false;
      for (const door of room.portals) {
        if (door.id === this.blocked) continue;
        const d = distance(player, door), normalSupport = support(player, door.normal);
        const tangentDistance = (player.x - door.innerCenter.x) * door.tangent.x + (player.y - door.innerCenter.y) * door.tangent.y;
        const outward = direction.x * door.normal.x + direction.y * door.normal.y < -0.01;
        if (!outward || d < normalSupport - 1e-6 || d > normalSupport + 4
          || Math.abs(tangentDistance) + support(player, door.tangent) > door.width / 2) continue;
        const next = this.maps.maps.find(map => map.id === door.target);
        const destination = next?.portals.find(portal => portal.id === door.destination);
        if (!destination) return false;
        const inset = support(player, destination.normal) + 24;
        const x = destination.innerCenter.x + destination.normal.x * inset;
        const y = destination.innerCenter.y + destination.normal.y * inset;
        if (!this.maps.setCurrentMap(next.id)) return false;
        session.setRoom(next);
        player.x = x; player.y = y;
        player.moving = false; player.animationTime = 0;
        const n = destination.normal;
        player.direction = Math.abs(n.x) >= Math.abs(n.y) ? (n.x > 0 ? 'right' : 'left') : (n.y > 0 ? 'down' : 'up');
        this.blocked = destination.id;
        return true;
      }
      return false;
    }
  }
  return { Controller };
})();
