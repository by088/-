import { DOMParser, DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
type XmlElement = Element;
type XmlNode = Node;
import { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { EditorError } from '../domain/EditorError.js';
import { Value } from '../domain/Value.js';
import { Transform } from './Transform.js';

export class SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  constructor(private readonly factory = new ShapeFactory()) {}
  decode(source: string): { document: SvgDocument; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new EditorError('invalid SVG: DTD and entity declarations are unsupported');
    const fail = (message: string): never => { throw new EditorError(`invalid SVG: ${message}`); };
    const xml = new DOMParser({errorHandler: {warning: fail, error: fail, fatalError: fail}}).parseFromString(source, 'image/svg+xml');
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg') throw new EditorError('invalid SVG: expected <svg> root');
    for (let node = xml.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 1 && node !== root) throw new EditorError('invalid SVG: multiple root elements');
      if (node.nodeType === 3 && node.nodeValue?.trim()) throw new EditorError('invalid SVG: text outside root');
    }
    this.checkNamespace(root);
    const attrs = this.attributes(root);
    const view = attrs.viewBox?.trim().split(/[\s,]+/).map(n => Value.number(n,'viewBox'));
    if (view && (view.length !== 4 || view[2]! <= 0 || view[3]! <= 0)) throw new EditorError('invalid SVG: invalid viewBox');
    const width = this.length(attrs.width ?? String(view?.[2] ?? 800),'width');
    const height = this.length(attrs.height ?? String(view?.[3] ?? 600),'height');
    const doc = new SvgDocument(width,height,view?.join(' '));
    if (attrs.id !== undefined) doc.importRootId(attrs.id);
    for (const [key,value] of Object.entries(attrs)) {
      if (!['xmlns','width','height','viewBox','id','version','transform'].includes(key)) doc.importRootPresentation(key,value);
    }
    // Reserve every explicit id before assigning any missing one.
    const ids = new Set<string>();
    if (attrs.id) ids.add(Value.id(attrs.id));
    this.visitElements(root, element => {
      this.checkNamespace(element);
      if (element.hasAttribute('id')) {
        const id = Value.id(element.getAttribute('id')!);
        if (ids.has(id)) throw new EditorError(`id already exists: ${id}`);
        ids.add(id);
      }
    });
    const counters = new Map<string,number>(); const warnings: string[] = [];
    const assign = (element: XmlElement): string => {
      if (element.hasAttribute('id')) return element.getAttribute('id')!;
      const tag = element.localName; let n = counters.get(tag) ?? 0;
      let id: string; do { id = `${tag}${++n}`; } while (ids.has(id));
      counters.set(tag,n); ids.add(id); warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`); return id;
    };
    const decode = (element: XmlElement, parentTransform: Transform, inherited: Record<string,string>): Shape => {
      const properties = this.attributes(element);
      const transform = parentTransform.then(Transform.parse(properties.transform));
      const content = this.text(element);
      const shape = this.factory.fromSvg(element.localName,assign(element),properties,content);
      const effective = {...inherited,...properties};
      if (shape instanceof Group) {
        if (content.trim()) throw new EditorError('invalid SVG: text inside <g>');
        for (const child of this.elements(element)) shape.insert(decode(child,transform,effective));
      } else {
        if (this.elements(element).length) throw new EditorError(`unsupported SVG child element in <${shape.tag}>`);
        if (shape.textContent === undefined && content.trim()) throw new EditorError(`invalid SVG: text inside <${shape.tag}>`);
        shape.scale(transform.factor); shape.move(transform.dx,transform.dy);
        if (transform.factor !== 1) {
          shape.set('stroke-width',String(this.length(effective['stroke-width'] ?? '1','stroke-width') * transform.factor));
          if (shape.textContent !== undefined) shape.importPresentation('font-size',String(this.length(effective['font-size'] ?? '16','font-size') * transform.factor));
        }
      }
      return shape;
    };
    if (this.text(root).trim()) throw new EditorError('invalid SVG: text inside <svg>');
    for (const child of this.elements(root)) doc.add(decode(child,Transform.parse(attrs.transform),attrs));
    return {document: doc,warnings};
  }
  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement;
    root.setAttribute('xmlns',this.namespace); root.setAttribute('width',String(document.width)); root.setAttribute('height',String(document.height)); root.setAttribute('viewBox',document.viewBox);
    for (const [key,value] of Object.entries(document.rootPresentation())) root.setAttribute(key,value);
    const append = (shape: Shape, parent: XmlElement): void => {
      const element = xml.createElementNS(this.namespace,shape.tag);
      for (const [key,value] of Object.entries(shape.attributes())) element.setAttribute(key,value);
      if (shape.textContent !== undefined) element.appendChild(xml.createTextNode(shape.textContent));
      for (const child of shape.children) append(child,element);
      parent.appendChild(element);
    };
    for (const shape of document.children) append(shape,root);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(xml) + '\n';
  }
  private checkNamespace(element: XmlElement): void {
    if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new EditorError(`unsupported SVG namespace: ${element.namespaceURI}`);
  }
  private attributes(element: XmlElement): Record<string,string> {
    const result: Record<string,string> = Object.create(null) as Record<string,string>;
    for (let i=0; i<element.attributes.length; i++) {
      const attr = element.attributes.item(i)!;
      if (attr.name.startsWith('xmlns:')) continue;
      result[attr.name] = attr.value;
    }
    return result;
  }
  private elements(node: XmlNode): XmlElement[] {
    const result: XmlElement[] = [];
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 1) result.push(child as XmlElement);
    }
    return result;
  }
  private text(node: XmlNode): string {
    let text = '';
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3 || child.nodeType === 4) text += child.nodeValue ?? '';
    }
    return text;
  }
  private visitElements(parent: XmlElement, visitor: (element: XmlElement) => void): void {
    for (const child of this.elements(parent)) { visitor(child); this.visitElements(child,visitor); }
  }
  private length(value: string, name: string): number { return Value.nonnegative(value.trim().replace(/px$/,''),name); }
}
