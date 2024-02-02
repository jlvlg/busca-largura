type Coords = [l: number, c: number];

interface Cell {
  obstacle?: boolean; objective?: boolean; start?: boolean
}

interface Node {
  state: Coords; cost: number, parent?: Node
}

enum Actions {
  UP, LEFT, DOWN, RIGHT
}

export default class Maze {
  public map: { obstacle?: boolean, objective?: boolean, start?: boolean }[][]
  public core: Node[][];
  public edge: Node[]

  constructor(public lines: number, public cols: number, public start: Coords, objective: Coords, obstacles?: Coords[]) {
    this.map = Array.from({ length: lines }, _ => Array.from({ length: cols }, _ => ({})));
    this.map[objective[0]][objective[1]].objective = true;
    this.map[start[0]][start[1]].start = true;

    if (obstacles)
      for (const obstacle of obstacles)
        this.map[obstacle[0]][obstacle[1]].obstacle = true;

    this.edge = [];
    this.core = Array.from({ length: this.lines }, _ => []);
  }

  solves(coords: Coords) {
    return !!this.map[coords[0]][coords[1]].objective;
  }

  actions(coords: Coords) {
    const actions: Actions[] = [];

    if (coords[0] > 0 && !this.map[coords[0] - 1][coords[1]].obstacle)
      actions.push(Actions.UP);
    if (coords[1] > 0 && !this.map[coords[0]][coords[1] - 1].obstacle)
      actions.push(Actions.LEFT);
    if (coords[0] < this.map.length - 1 && !this.map[coords[0] + 1][coords[1]].obstacle)
      actions.push(Actions.DOWN);
    if (coords[1] < this.map[coords[0]].length - 1 && !this.map[coords[0]][coords[1] + 1].obstacle)
      actions.push(Actions.RIGHT);

    return actions;
  }

  async solve(visualize?: boolean) {
    const start: Node = { state: this.start, cost: 0 };
    this.edge.push(start);

    while (this.edge.length) {
      if (visualize) {
        await new Promise(r => setTimeout(r, 25));
        this.print();
      }
      const node = this.edge.shift()!;
      if (!this.core[node.state[0]][node.state[1]]) {
        if (this.solves(node.state)) {
          this.print([node.cost, this.retrace(node)]);
          return
        }

        this.core[node.state[0]][node.state[1]] = node;

        for (const action of this.actions(node.state)) {
          let child: Node;
          let newcoords: Coords;
          switch (action) {
            case Actions.UP:
              newcoords = [node.state[0] - 1, node.state[1]];
              break;
            case Actions.LEFT:
              newcoords = [node.state[0], node.state[1] - 1];
              break;
            case Actions.DOWN:
              newcoords = [node.state[0] + 1, node.state[1]];
              break;
            case Actions.RIGHT:
              newcoords = [node.state[0], node.state[1] + 1];
          }

          child = { state: newcoords, cost: node.cost + 1, parent: node }

          const existing = this.core[child.state[0]][child.state[1]];
          if (existing && child.cost < existing.cost)
            this.core[child.state[0]][child.state[1]] = child;

          if (!existing && !this.inEdge(child.state))
            this.edge.push(child);
        }
      }
    }

    this.print(false);
  }

  inEdge(coords: Coords) {
    return JSON.stringify(this.edge.map(i => i.state)).includes(JSON.stringify(coords))
  }

  retrace(node: Node): Coords[] {
    if (!node.parent)
      return [node.state];
    return [node.state].concat(this.retrace(node.parent));
  }

  print(path?: [number, Coords[]] | false) {
    console.clear()
    if (path === false)
      process.stdout.write("SEM SOLUÇÃO");
    else {
      process.stdout.write("ENTRADA:".padEnd(this.cols + 1));
      process.stdout.write(`SAÍDA${path ? ` (custo = ${path[0]})` : ''}:`.padEnd(this.cols + 1));
    }
    process.stdout.write("\n\n");
    for (const [l, line] of this.map.entries()) {
      for (const [c, col] of line.entries()) {
        this.writeCell([l, line], [c, col])
      }

      process.stdout.write(" ")

      for (const [c, col] of line.entries()) {
        this.writeCell([l, line], [c, col], path, !path)
      }

      process.stdout.write("\n");
    }
  }

  writeCell(l: [l: number, line: Cell[]], c: [c: number, col: Cell], path?: [number, Coords[]] | false, progress?: boolean) {
    if (c[1].start)
      process.stdout.write("@");
    else if (c[1].objective)
      process.stdout.write("$");
    else if (c[1].obstacle)
      process.stdout.write("|");
    else if (progress && this.core[l[0]][c[0]])
      process.stdout.write("#");
    else if (progress && this.inEdge([l[0], c[0]]))
      process.stdout.write("?");
    else if (path && JSON.stringify(path).includes(JSON.stringify([l[0], c[0]])))
      process.stdout.write(".");
    else
      process.stdout.write("_");
  }

  static generate(lines: number, cols: number, start: Coords, objective: Coords, odds: number) {
    const obstacles = Array.from({ length: lines }, (_, l) => Array.from<unknown, Coords>({ length: cols }, (_, c) => [l, c]))
      .flat()
      .filter(i => (i[0] !== start[0] || i[1] !== start[1]) && (i[0] !== objective[0] || i[1] !== objective[1]) && Math.random() < odds);

    return new Maze(lines, cols, start, objective, obstacles);
  }
}
