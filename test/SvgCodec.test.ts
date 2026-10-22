import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgCodec } from '../src/io/SvgCodec.ts';
const codec=new SvgCodec();
test('reserve explicit ids before assigning, nested ids and case sensitivity',()=>{
 const result=codec.decode('<svg width="400" height="300"><rect/><rect id="rect1"/><g><text>开始 &amp; &lt;end&gt;</text><circle/></g><rect id="Rect1"/></svg>');
 assert.deepEqual(result.warnings,['warning: assigned id rect2 to unnamed <rect>','warning: assigned id g1 to unnamed <g>','warning: assigned id text1 to unnamed <text>','warning: assigned id circle1 to unnamed <circle>']);
 assert.equal(result.document.find('text1').content,'开始 & <end>');
 const again=codec.decode(codec.encode(result.document));assert.deepEqual(again.warnings,[]);
 assert.equal(codec.encode(again.document),codec.encode(result.document));
});
test('all six types, XML attributes and text roundtrip, box marker degrades to g',()=>{
 const input='<svg><g id="box" data-kind="box"><rect id="r" x="1" y="2" width="3" height="4" fill="a&amp;b&quot;c"/><text id="t" x="1" y="2">  hello &quot;x&quot; &amp; 世界  </text><circle id="c" r="2"/><ellipse id="e" rx="2" ry="3"/><line id="l" x2="3" y2="4" stroke="red"/></g></svg>';
 const d=codec.decode(input).document;assert.equal(d.find('box').type,'g');assert.equal(d.all().length,6);
 const e=codec.encode(d);const decoded=codec.decode(e).document;assert.equal(decoded.find('t').content,'  hello "x" & 世界  ');assert.equal(decoded.find('r').attributes().fill,'a&b"c');
});
test('translate and scale normalize nested groups without double-transform',()=>{
 const d=codec.decode('<svg><g id="g" transform="translate(60,40)"><g id="n" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/></g></g></svg>').document;
 assert.equal(d.find('r').attributes().x,'260');assert.equal(d.find('r').attributes().y,'40');assert.equal(d.find('r').attributes().width,'96');
 assert.equal(codec.encode(codec.decode(codec.encode(d)).document),codec.encode(d));
});
test('reject malformed, duplicate, unsupported and unsafe XML',()=>{
 for(const s of ['<svg><g></svg>','<svg/><svg/>','<svg><rect id="a"/><circle id="a"/></svg>','<!DOCTYPE svg><svg/>','<svg><path id="a"/></svg>','<svg><g id="a" transform="rotate(30)"/></svg>','<svg width="0"/>','<svg><rect id="a" onclick="x"/></svg>'])assert.throws(()=>codec.decode(s),s);
});
