
export interface MindMapNode {
  id: string;
  label: string;
  depth: number;
  parentId?: string;
  x?: number;
  y?: number;
}

export interface MindMapLink {
  source: string;
  target: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  links: MindMapLink[];
}
