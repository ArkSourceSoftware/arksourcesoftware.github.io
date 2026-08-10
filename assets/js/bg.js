
const canvas = document.getElementById("background_canvas");
const ctx = canvas.getContext("2d");

// CONFIG
const NODE_SPACING = 110;
const TARGET_LANE_SPACING = 140;
const VIEW_PADDING = 200;

const PARALLAX_FAR = 0.15;
const PARALLAX_NEAR = 0.35;

const FPS = 30;
let lastTime = 0;
const interval = 1000 / FPS;

const mouse = { x: 0, y: 0 };
const MOUSE_RADIUS = 140;

// STATE
let lanes = [];
let nodesNear = [];
let nodesFar = [];
let connectionsNear = [];
let connectionsFar = [];

let LANE_COUNT;
let LANE_SPACING;


window.addEventListener("load", () => {
	resize();
	generate();
	requestAnimationFrame(animate);
});
window.addEventListener("mousemove", (e) => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
});
window.addEventListener("resize", resize);


// RESIZE
function resize()
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	LANE_COUNT = Math.max(2, Math.min(18, Math.floor(canvas.width / TARGET_LANE_SPACING)));
	LANE_SPACING = canvas.width / LANE_COUNT;

	generate();
}

class Node
{
	constructor(x, y, intensity = 1)
	{
		this.x = x;
		this.y = y;
		this.pulse = Math.random() * Math.PI * 2;
		this.intensity = intensity; // far vs near
	}

	update()
	{
		this.pulse += 0.04;

	}

	draw(yScreen)
	{
		const r = 2 + Math.sin(this.pulse) * 1.2;

		const depth = yScreen / canvas.height;

		const dx = this.x - mouse.x;
		const dy = yScreen - mouse.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const influence = Math.max(0, 1 - dist / MOUSE_RADIUS);

		const alpha = (0.15 + (1 - depth) * 0.5) * this.intensity + influence * 0.6;

		ctx.beginPath();
		ctx.arc(this.x, yScreen, r, 0, Math.PI * 2);

		ctx.fillStyle = `rgba(88,166,255,${alpha})`;
		ctx.fill();
	}
}

class Connection
{
	constructor(a, b, intensity = 1)
	{
		this.a = a;
		this.b = b;
		this.offset = Math.random();
		this.intensity = intensity;
	}

	draw(time, scrollOffset)
	{
		const ay = this.a.y - scrollOffset;
		const by = this.b.y - scrollOffset;

		const depth = ay / canvas.height;
		const alpha = (0.06 + (1 - depth) * 0.25) * this.intensity;

		ctx.strokeStyle = `rgba(120,130,150,${alpha})`;
		ctx.lineWidth = this.intensity === 1 ? 1.4 : 1;

		ctx.beginPath();
		ctx.moveTo(this.a.x, ay);
		ctx.lineTo(this.a.x, by);
		ctx.lineTo(this.b.x, by);
		ctx.stroke();

		// Flow dot.
		const t = (time * 0.0004 + this.offset) % 1;

		const x = this.a.x + (this.b.x - this.a.x) * t;
		const y = this.a.y + (this.b.y - this.a.y) * t - scrollOffset;

		ctx.beginPath();
		ctx.arc(x, y, 1.3, 0, Math.PI * 2);
		ctx.fillStyle = "rgba(88,166,255,0.35)";
		ctx.fill();
	}
}

function generate()
{
	lanes = [];
	nodesNear = [];
	nodesFar = [];
	connectionsNear = [];
	connectionsFar = [];

	for (let i = 0; i < LANE_COUNT; i++)
	{
		lanes.push([]);
	}

	const totalHeight = document.body.scrollHeight;
	const rows = Math.floor(totalHeight / NODE_SPACING);

	// NODES
	for (let y = 0; y < rows; y++)
	{
		for (let l = 0; l < LANE_COUNT; l++)
		{
			if (Math.random() > 0.45)
			{
				const jitter = (Math.random() - 0.5) * 18;
				const x = l * LANE_SPACING + jitter;
				const yPos = y * NODE_SPACING;

				// far layer (faint structure).
				if (Math.random() > 0.5)
				{
					const node = new Node(x, yPos, 0.4);
					lanes[l].push(node);
					nodesFar.push(node);
				}

				// near layer (main graph).
				if (Math.random() > 0.6)
				{
					const node = new Node(x, yPos, 1);
					lanes[l].push(node);
					nodesNear.push(node);
				}
			}
		}
	}

	// CONNECTIONS
	for (let l = 0; l < LANE_COUNT; l++)
	{
		const lane = lanes[l];

		for (let i = 0; i < lane.length - 1; i++)
		{
			const a = lane[i];
			const b = lane[i + 1];

			if (!a || !b)
				continue;

			const conn = new Connection(a, b, a.intensity || 1);

			if (a.intensity === 1)
			{
				connectionsNear.push(conn);
			}
			else
			{
				connectionsFar.push(conn);
			}
		}
	}

	for (let l = 0; l < LANE_COUNT - 1; l++)
	{
		const laneA = lanes[l];
		const laneB = lanes[l + 1];

		for (let i = 0; i < Math.min(laneA.length, laneB.length); i++)
		{
			if (Math.random() > 0.7 && laneA[i] && laneB[i])
			{
				connectionsNear.push(new Connection(laneA[i], laneB[i], 0.8));
			}
		}
	}
}


function animate(time)
{
	if (time - lastTime < interval)
	{
		requestAnimationFrame(animate);
		return;
	}

	lastTime = time;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const scrollY = window.scrollY;

	// FAR GRAPH
	const farOffset = scrollY * PARALLAX_FAR;

	connectionsFar.forEach(c =>
	{
		const y = c.a.y - farOffset;

		if (y < -VIEW_PADDING || y > canvas.height + VIEW_PADDING)
			return;

		c.draw(time, farOffset);
	});

	nodesFar.forEach(n =>
	{
		const y = n.y - farOffset;

		if (y < -VIEW_PADDING || y > canvas.height + VIEW_PADDING)
			return;

		n.update();
		n.draw(y);
	});

	// NEAR GRAPH
	const nearOffset = scrollY * PARALLAX_NEAR;

	connectionsNear.forEach(c =>
	{
		const y = c.a.y - nearOffset;

		if (y < -VIEW_PADDING || y > canvas.height + VIEW_PADDING)
			return;

		c.draw(time, nearOffset);
	});

	nodesNear.forEach(n =>
	{
		const y = n.y - nearOffset;

		if (y < -VIEW_PADDING || y > canvas.height + VIEW_PADDING)
			return;

		n.update();
		n.draw(y);
	});

	const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

	gradient.addColorStop(0, "rgba(0,0,0,0.0)");
	gradient.addColorStop(1, "rgba(0,0,0,0.25)");

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	requestAnimationFrame(animate);
}