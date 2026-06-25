class HandMarker {
  constructor(label, color, radiusPx = 18) {
    this.label = label;
    this.color = color;
    this.radiusPx = radiusPx;
    this.visible = false;
    this.xPx = 0;
    this.yPx = 0;
  }

  hitTest(px, py) {
    if (!this.visible) return false;
    const dx = px - this.xPx;
    const dy = py - this.yPx;
    return Math.sqrt(dx * dx + dy * dy) <= this.radiusPx;
  }

  draw(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.xPx, this.yPx, this.radiusPx, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.xPx, this.yPx);
    ctx.restore();
  }
}
