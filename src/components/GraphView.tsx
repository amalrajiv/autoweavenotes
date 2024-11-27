import React, { useRef, useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useNoteStore } from '@/store/useNoteStore';
import { cn } from '@/lib/utils';
import { Search, ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { useTheme } from './theme-provider';
import * as d3 from 'd3';

interface GraphViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { notes, setActiveNote } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { theme } = useTheme();
  
  // Graph settings
  const [showTags, setShowTags] = useState(true);
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeSize, setNodeSize] = useState(4);
  const [linkThickness, setLinkThickness] = useState(1);
  const [centerForce, setCenterForce] = useState(1);
  const [repelForce, setRepelForce] = useState(1);
  const [linkForce, setLinkForce] = useState(1);
  const [linkDistance, setLinkDistance] = useState(100);

  // Theme-aware colors
  const colors = useMemo(() => {
    const getThemeColors = () => {
      switch (theme) {
        case 'light':
          return {
            node: 'hsl(240, 10%, 40%)',
            link: 'hsl(240, 10%, 40%, 0.2)',
            text: 'hsl(240, 10%, 20%)'
          };
        case 'dark':
          return {
            node: 'hsl(240, 10%, 85%)',
            link: 'hsl(240, 10%, 85%, 0.2)',
            text: 'hsl(240, 10%, 95%)'
          };
        case 'sunset':
          return {
            node: 'hsl(24.6, 95%, 33.1%)',
            link: 'hsl(24.6, 95%, 33.1%, 0.2)',
            text: 'hsl(24.6, 95%, 23.1%)'
          };
        case 'dim':
          return {
            node: 'hsl(217, 91.2%, 59.8%)',
            link: 'hsl(217, 91.2%, 59.8%, 0.2)',
            text: 'hsl(217, 91.2%, 89.8%)'
          };
        case 'nord':
          return {
            node: 'hsl(193, 43%, 67%)',
            link: 'hsl(193, 43%, 67%, 0.2)',
            text: 'hsl(193, 43%, 87%)'
          };
        case 'system':
          return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? {
                node: 'hsl(240, 10%, 85%)',
                link: 'hsl(240, 10%, 85%, 0.2)',
                text: 'hsl(240, 10%, 95%)'
              }
            : {
                node: 'hsl(240, 10%, 40%)',
                link: 'hsl(240, 10%, 40%, 0.2)',
                text: 'hsl(240, 10%, 20%)'
              };
        default:
          return {
            node: 'hsl(240, 10%, 40%)',
            link: 'hsl(240, 10%, 40%, 0.2)',
            text: 'hsl(240, 10%, 20%)'
          };
      }
    };

    const themeColors = getThemeColors();
    
    return {
      node: {
        default: themeColors.node,
        selected: 'hsl(var(--primary))',
        highlighted: 'hsl(var(--primary) / 0.7)',
      },
      link: {
        default: themeColors.link,
        highlighted: 'hsl(var(--primary))',
      },
      text: themeColors.text,
    };
  }, [theme]);

  useEffect(() => {
    if (containerRef.current && isOpen) {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({
            width: Math.max(rect.width - 48, 400),
            height: Math.max(rect.height - 48, 300)
          });
        }
      };

      updateDimensions();
      const observer = new ResizeObserver(updateDimensions);
      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }
  }, [isOpen]);

  const graphData = useMemo(() => {
    const nodes = notes.map((note) => ({
      id: note.id,
      name: note.title || 'Untitled Note',
      val: nodeSize
    }));

    const links: Array<{ source: string; target: string; value: number }> = [];
    const linkSet = new Set<string>();

    notes.forEach(note => {
      const wikiLinkRegex = /\[\[(.*?)\]\]/g;
      const matches = note.content.match(wikiLinkRegex) || [];
      
      matches.forEach(match => {
        const linkedTitle = match.slice(2, -2);
        const targetNote = notes.find(n => n.title === linkedTitle);
        if (targetNote && targetNote.id !== note.id) {
          const linkId = `${note.id}-${targetNote.id}`;
          if (!linkSet.has(linkId)) {
            links.push({
              source: note.id,
              target: targetNote.id,
              value: 1
            });
            linkSet.add(linkId);
          }
        }
      });
    });

    const filteredNodes = nodes.filter(node => {
      if (!searchQuery) return true;
      return node.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredLinks = links.filter(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return false;
      if (!searchQuery) return true;
      return (sourceNode.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              targetNode.name.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    return { 
      nodes: showOrphans ? filteredNodes : filteredNodes.filter(node => 
        filteredLinks.some(link => link.source === node.id || link.target === node.id)
      ),
      links: filteredLinks 
    };
  }, [notes, searchQuery, showOrphans, nodeSize]);

  useEffect(() => {
    if (graphRef.current && isOpen) {
      // Initial setup
      graphRef.current
        .d3Force('charge')
        .strength(-100 * repelForce);
      
      graphRef.current
        .d3Force('link')
        .distance(linkDistance)
        .strength(linkForce);

      graphRef.current
        .d3Force('center')
        .strength(centerForce);

      // Center the graph
      setTimeout(() => {
        graphRef.current.zoomToFit(400);
      }, 500);
    }
  }, [isOpen, centerForce, repelForce, linkForce, linkDistance]);

  const handleNodeClick = (node: any) => {
    const note = notes.find((n) => n.id === node.id);
    if (note) {
      setActiveNote(note);
      setSelectedNode(node.id);
      
      const connectedNodes = new Set<string>([node.id]);
      const connectedLinks = new Set<string>();
      
      graphData.links.forEach(link => {
        if (link.source === node.id || link.target === node.id) {
          connectedNodes.add(typeof link.source === 'string' ? link.source : link.source.id);
          connectedNodes.add(typeof link.target === 'string' ? link.target : link.target.id);
          connectedLinks.add(`${link.source}-${link.target}`);
        }
      });

      setHighlightNodes(connectedNodes);
      setHighlightLinks(connectedLinks);
    }
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[80vh] p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">Knowledge Graph</DialogTitle>
        </DialogHeader>

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="icon" onClick={() => graphRef.current?.zoomToFit(400)}>
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {
              const currentZoom = graphRef.current?.zoom();
              graphRef.current?.zoom(currentZoom * 1.2, 400);
            }}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {
              const currentZoom = graphRef.current?.zoom();
              graphRef.current?.zoom(currentZoom * 0.8, 400);
            }}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 bg-background/80 backdrop-blur-sm p-4 rounded-lg border w-64">
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="font-medium">Filters</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Tags</span>
                  <Switch checked={showTags} onCheckedChange={setShowTags} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Orphans</span>
                  <Switch checked={showOrphans} onCheckedChange={setShowOrphans} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="font-medium">Display</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Node Size</span>
                    <span className="text-sm text-muted-foreground">{nodeSize}</span>
                  </div>
                  <Slider
                    value={[nodeSize]}
                    onValueChange={([value]) => setNodeSize(value)}
                    min={1}
                    max={10}
                    step={0.5}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Link Thickness</span>
                    <span className="text-sm text-muted-foreground">{linkThickness}</span>
                  </div>
                  <Slider
                    value={[linkThickness]}
                    onValueChange={([value]) => setLinkThickness(value)}
                    min={0.5}
                    max={5}
                    step={0.5}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="font-medium">Forces</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Center Force</span>
                    <span className="text-sm text-muted-foreground">{centerForce}</span>
                  </div>
                  <Slider
                    value={[centerForce]}
                    onValueChange={([value]) => setCenterForce(value)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Repel Force</span>
                    <span className="text-sm text-muted-foreground">{repelForce}</span>
                  </div>
                  <Slider
                    value={[repelForce]}
                    onValueChange={([value]) => setRepelForce(value)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Link Force</span>
                    <span className="text-sm text-muted-foreground">{linkForce}</span>
                  </div>
                  <Slider
                    value={[linkForce]}
                    onValueChange={([value]) => setLinkForce(value)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Link Distance</span>
                    <span className="text-sm text-muted-foreground">{linkDistance}</span>
                  </div>
                  <Slider
                    value={[linkDistance]}
                    onValueChange={([value]) => setLinkDistance(value)}
                    min={50}
                    max={300}
                    step={10}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="absolute top-4 right-4 text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded-md">Esc</kbd> to close
        </div>

        <div ref={containerRef} className="w-full h-full bg-background/80 backdrop-blur-sm rounded-lg border border-border">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel="name"
            nodeColor={(node: any) => {
              if (selectedNode === node.id) return colors.node.selected;
              if (highlightNodes.has(node.id)) return colors.node.highlighted;
              return colors.node.default;
            }}
            linkColor={(link: any) => {
              const id = `${link.source.id || link.source}-${link.target.id || link.target}`;
              return highlightLinks.has(id) ? colors.link.highlighted : colors.link.default;
            }}
            nodeRelSize={nodeSize}
            linkWidth={link => highlightLinks.has(`${link.source}-${link.target}`) ? linkThickness * 2 : linkThickness}
            linkDirectionalParticles={4}
            linkDirectionalParticleWidth={linkThickness}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            backgroundColor="transparent"
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Inter`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              ctx.fillStyle = selectedNode === node.id
                ? colors.node.selected
                : highlightNodes.has(node.id)
                  ? colors.node.highlighted
                  : colors.node.default;
              
              ctx.beginPath();
              ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
              ctx.fill();

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = colors.text;
              ctx.fillText(label, node.x, node.y + nodeSize + fontSize);
            }}
            cooldownTicks={50}
            warmupTicks={100}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};