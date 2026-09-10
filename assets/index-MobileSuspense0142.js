import {
    R as wt,
    V as Xe,
    B as yt,
    a as vt,
    C as Ue,
    S as Be,
    N as ge,
    b as xt,
    c as Et,
    L as Ot,
    d as St,
    F as Tt,
    I as kt,
    M as K,
    G as W,
    e as Ve,
    f as ne,
    H as It,
    g as Ze,
    P as xe,
    h as Je,
    i as Rt,
    j as Ee,
    k as Qe,
    l as Mt,
    m as zt,
    O as Nt,
    W as At,
    n as Ct,
    o as Pt,
    p as Dt,
    q as Lt
} from "./three-BnHopTeJ.js";
(function() {
    const e = document.createElement("link").relList;
    if (e && e.supports && e.supports("modulepreload")) return;
    for (const s of document.querySelectorAll('link[rel="modulepreload"]')) i(s);
    new MutationObserver(s => {
        for (const o of s)
            if (o.type === "childList")
                for (const n of o.addedNodes) n.tagName === "LINK" && n.rel === "modulepreload" && i(n)
    }).observe(document, {
        childList: !0,
        subtree: !0
    });

    function t(s) {
        const o = {};
        return s.integrity && (o.integrity = s.integrity), s.referrerPolicy && (o.referrerPolicy = s.referrerPolicy), s.crossOrigin === "use-credentials" ? o.credentials = "include" : s.crossOrigin === "anonymous" ? o.credentials = "omit" : o.credentials = "same-origin", o
    }

    function i(s) {
        if (s.ep) return;
        s.ep = !0;
        const o = t(s);
        fetch(s.href, o)
    }
})();
class Ge {
    constructor(e) {
        this.id = e
    }
    id;
    components = new Map;
    set(e, t) {
        return this.components.set(e, t), this
    }
    get(e) {
        return this.components.get(e)
    }
}
class Ft {
    entities = new Map;
    systems = [];
    cleanup = [];
    add(e) {
        if (this.entities.has(e.id)) throw new Error("Duplicate entity");
        return this.entities.set(e.id, e), e
    }
    system(e) {
        this.systems.push(e)
    }
    onDispose(e) {
        this.cleanup.push(e)
    }
    update(e) {
        for (const t of this.systems) t(e)
    }
    dispose() {
        for (const e of this.cleanup) e();
        this.entities.clear(), this.systems = [], this.cleanup = []
    }
}
class $t {
    constructor(e, t) {
        this.update = e, this.draw = t
    }
    update;
    draw;
    accumulator = 0;
    previous = 0;
    paused = !0;
    steps = 0;
    frame = e => {
        const t = this.previous ? Math.min(.1, (e - this.previous) / 1e3) : 0;
        if (this.previous = e, this.paused) this.accumulator = 0;
        else {
            this.accumulator += t;
            let i = 0;
            for (; !this.paused && this.accumulator >= 1 / 60 && i++ < 6;) this.update(1 / 60), this.accumulator -= 1 / 60, this.steps++
        }
        this.draw(t)
    }
}
class Ht {
    constructor(e) {
        this.canvas = e;
        const t = {
            signal: this.abort.signal
        };
        window.addEventListener("keydown", i => {
            this.active && (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(i.code) && i.preventDefault(), i.repeat || this.pressed.add(i.code), this.keys.add(i.code))
        }, t), window.addEventListener("keyup", i => this.keys.delete(i.code), t), window.addEventListener("mousemove", i => {
            this.active && document.pointerLockElement === this.canvas && (this.dx += i.movementX, this.dy += i.movementY)
        }, t), window.addEventListener("blur", () => this.clear(), t)
    }
    canvas;
    keys = new Set;
    pressed = new Set;
    dx = 0;
    dy = 0;
    virtualMoveX = 0;
    virtualMoveY = 0;
    active = !1;
    abort = new AbortController;
    down(e) {
        return this.keys.has(e)
    }
    take(e) {
        const t = this.pressed.has(e);
        return this.pressed.delete(e), t
    }
    clear() {
        this.keys.clear(), this.pressed.clear(), this.dx = this.dy = 0, this.virtualMoveX = this.virtualMoveY = 0
    }
    dispose() {
        this.abort.abort(), this.clear()
    }
}
class Ut {
    constructor(e, t) {
        this.input = e, this.collision = t
    }
    input;
    collision;
    x = 0;
    z = 0;
    y = 1.65;
    yaw = 0;
    pitch = 0;
    velocityY = 0;
    distance = 0;
    invertY = !1;
    update(e) {
        this.yaw -= this.input.dx * .002 + (Number(this.input.down("ArrowRight")) - Number(this.input.down("ArrowLeft"))) * e * 1.7, this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - this.input.dy * .002 * (this.invertY ? -1 : 1) + (Number(this.input.down("ArrowUp")) - Number(this.input.down("ArrowDown"))) * e * 1.3)), this.input.dx = this.input.dy = 0;
        let t = Number(this.input.down("KeyW")) - Number(this.input.down("KeyS")) + (this.input.virtualMoveY ?? 0),
            i = Number(this.input.down("KeyD")) - Number(this.input.down("KeyA")) + (this.input.virtualMoveX ?? 0);
        const s = Math.hypot(t, i);
        s > 1 && (t /= s, i /= s);
        const o = this.input.down("ControlLeft") || this.input.down("KeyC"),
            n = o ? 1 : this.input.down("ShiftLeft") ? 3.5 : 2.2,
            r = (-Math.sin(this.yaw) * t + Math.cos(this.yaw) * i) * n * e,
            c = (-Math.cos(this.yaw) * t - Math.sin(this.yaw) * i) * n * e,
            u = this.collision.move(this.x, this.z, r, c),
            d = Math.hypot(this.x - u.x, this.z - u.z);
        this.distance += d, this.x = u.x, this.z = u.z;
        const l = o ? 1.08 : 1.65;
        return this.y += (l - this.y) * Math.min(1, e * 14), this.velocityY = 0, d
    }
}
class Bt {
    ray = new wt;
    target = null;
    distance = 1 / 0;
    update(e, t) {
        this.ray.setFromCamera(new Xe(0, 0), e), this.ray.far = 12;
        const i = this.ray.intersectObjects(t.children, !0)[0];
        let s = i?.object ?? null;
        for (this.target = null; s;) {
            if (s.userData.interactable) {
                this.target = s.userData.interactable;
                break
            }
            s = s.parent
        }
        return this.distance = i?.distance ?? 1 / 0, this.target
    }
    get actionable() {
        return !!this.target?.action && this.distance <= 2.4
    }
}
class B {
    state = 2166136261;
    constructor(e) {
        for (const t of e) this.state = Math.imul(this.state ^ t.charCodeAt(0), 16777619) >>> 0
    }
    next() {
        let e = this.state += 1831565813;
        return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296
    }
    int(e, t) {
        return e + Math.floor(this.next() * (t - e + 1))
    }
}
const Te = {
    observation: {
        width: [8, 10],
        depth: [10, 12],
        props: 2
    },
    hesitation: {
        width: [8, 9],
        depth: [12, 14],
        props: 3
    },
    surveillance: {
        width: [10, 12],
        depth: [10, 12],
        props: 4
    }
};
class Vt {
    build(e, t) {
        return {
            width: e.int(...t.width),
            depth: e.int(...t.depth),
            height: 3.5
        }
    }
}
class Gt {
    candidate(e, t, i) {
        return {
            id: `cabinet-${i}`,
            kind: "cabinet",
            x: (e.next() < .5 ? -1 : 1) * (t.size.width / 2 - .6),
            z: (e.next() - .5) * (t.size.depth - 3),
            width: .7,
            depth: 1.1,
            solid: !0
        }
    }
}
const et = (a, e, t = .15) => Math.abs(a.x - e.x) < (a.width + e.width) / 2 + t && Math.abs(a.z - e.z) < (a.depth + e.depth) / 2 + t;
class jt {
    place(e, t, i) {
        const s = new Gt;
        for (let o = 0; o < i; o++)
            for (let n = 0; n < 32; n++) {
                const r = s.candidate(t, e, o);
                if (e.props.every(c => !et(r, c)) && Math.abs(r.x) > 1.2) {
                    e.props.push(r);
                    break
                }
            }
    }
}
class oe {
    validate(e) {
        const t = [];
        if (!e || e.version !== 1 || !Object.hasOwn(Te, e.archetype)) return ["Invalid schema/archetype"];
        if ([e.size?.width, e.size?.depth, e.size?.height, e.spawn?.x, e.spawn?.z, e.spawn?.yaw, e.door?.x, e.door?.z, e.door?.width, e.door?.height, e.lighting?.phase].some(c => !Number.isFinite(c)) || !Array.isArray(e.props)) return ["Non-finite/missing geometry"];
        const {
            width: s,
            depth: o,
            height: n
        } = e.size;
        (s < 5 || s > 30 || o < 5 || o > 30 || n < 2.5 || n > 8) && t.push("Dimensions out of range"), (Math.abs(e.spawn.x) > s / 2 - .3 || Math.abs(e.spawn.z) > o / 2 - .3) && t.push("Spawn out of bounds"), (e.door.width < 1 || e.door.height < 2 || e.door.height > n || Math.abs(e.door.x) + e.door.width / 2 > s / 2 - .2 || e.door.z !== -o / 2) && t.push("Invalid door");
        const r = new Set;
        for (const c of e.props) {
            if (![c.x, c.z, c.width, c.depth].every(Number.isFinite) || c.width <= 0 || c.depth <= 0) {
                t.push("Invalid prop");
                continue
            }
            r.has(c.id) && t.push("Duplicate ID"), r.add(c.id), (Math.abs(c.x) + c.width / 2 > s / 2 - .1 || Math.abs(c.z) + c.depth / 2 > o / 2 - .1) && t.push("Prop out of bounds"), c.solid && Math.abs(e.spawn.x - c.x) < c.width / 2 + .25 && Math.abs(e.spawn.z - c.z) < c.depth / 2 + .25 && t.push("Spawn obstructed")
        }
        for (let c = 0; c < e.props.length; c++)
            for (let u = c + 1; u < e.props.length; u++) et(e.props[c], e.props[u], 0) && t.push("Prop overlap");
        return !t.length && !this.hasPath(e) && t.push("No clear path to exit"), t
    }
    hasPath(e) {
        const s = e.size.width,
            o = e.size.depth,
            n = Math.ceil(s / .25),
            r = Math.ceil(o / .25),
            c = (m, g) => [Math.min(n - 1, Math.max(0, Math.floor((m + s / 2) / .25))), Math.min(r - 1, Math.max(0, Math.floor((g + o / 2) / .25)))],
            [u, d] = c(e.spawn.x, e.spawn.z),
            l = new Set,
            y = [
                [u, d]
            ];
        for (let m = 0; m < y.length; m++) {
            const [g, E] = y[m], P = E * n + g;
            if (l.has(P)) continue;
            l.add(P);
            const S = -s / 2 + (g + .5) * .25,
                k = -o / 2 + (E + .5) * .25;
            if (!(Math.abs(S) > s / 2 - .26 || k > o / 2 - .26) && !e.props.some(I => I.solid && Math.abs(S - I.x) < I.width / 2 + .26 && Math.abs(k - I.z) < I.depth / 2 + .26)) {
                if (k < -o / 2 + .5 && Math.abs(S - e.door.x) < e.door.width / 2 - .26) return !0;
                for (const [I, L] of [
                        [g + 1, E],
                        [g - 1, E],
                        [g, E + 1],
                        [g, E - 1]
                    ]) I >= 0 && I < n && L >= 0 && L < r && !l.has(L * n + I) && y.push([I, L])
            }
        }
        return !1
    }
}
class tt {
    generate(e, t = "observation") {
        if (typeof e != "string" || e.length === 0 || e.length > 128 || !Object.hasOwn(Te, t)) throw new Error("Invalid seed/archetype");
        const i = new B(`${e}|${t}|v1`),
            s = Te[t],
            o = new Vt().build(i, s),
            n = {
                version: 1,
                seed: e,
                id: `R-${e}`,
                archetype: t,
                size: o,
                spawn: {
                    x: 0,
                    z: o.depth / 2 - 1.8,
                    yaw: 0
                },
                door: {
                    x: 0,
                    z: -o.depth / 2,
                    width: 1.6,
                    height: 2.6
                },
                props: [],
                lighting: {
                    emergency: !1,
                    phase: i.next() * 10
                }
            };
        new jt().place(n, i, s.props);
        const r = new oe;
        r.validate(n).length && (n.props = []);
        const c = r.validate(n);
        if (c.length) throw new Error(c.join(", "));
        return n
    }
}
class Wt {
    context = null;
    master;
    noise;
    voices = new Set;
    ambience = [];
    ambienceGain = null;
    samples = {};
    sampleAmbience = null;
    sampleAmbienceGain = null;
    airflowSource = null;
    airflowGain = null;
    airflowPanner = null;
    roomAcoustic = null;
    normalClock = 999;
    normalSeq = 0;
    normalRng = null;
    normalitySuppressed = !1;
    muted = !1;
    listener = {
        x: 0,
        y: 1.65,
        z: 0
    };
    occlusion = () => 0;
    async start() {
        if (!this.context) {
            this.context = new AudioContext, this.master = this.context.createGain(), this.master.gain.value = this.muted ? 0 : .35, this.ambienceGain = this.context.createGain(), this.ambienceGain.gain.value = 1, this.ambienceGain.connect(this.master);
            const e = this.context.createDynamicsCompressor();
            e.threshold.value = -10, e.knee.value = 8, e.ratio.value = 8, this.master.connect(e), e.connect(this.context.destination), this.noise = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
            const t = this.noise.getChannelData(0),
                i = new B("observed-audio");
            for (let c = 0; c < t.length; c++) t[c] = i.next() * 2 - 1;
            const s = this.context.createPanner();
            s.panningModel = "HRTF", s.refDistance = 3, s.positionY.value = 3.2, s.positionZ.value = -2, s.connect(this.ambienceGain);
            for (const c of [50, 100]) {
                const u = this.context.createOscillator();
                u.frequency.value = c;
                const d = this.context.createGain();
                d.gain.value = c === 50 ? .035 : .018, u.connect(d), d.connect(s), u.start(), this.ambience.push(u)
            }
            const o = this.context.createBufferSource();
            o.buffer = this.noise, o.loop = !0;
            const n = this.context.createBiquadFilter();
            n.type = "lowpass", n.frequency.value = 260;
            const r = this.context.createGain();
            r.gain.value = .065, o.connect(n), n.connect(r), r.connect(this.ambienceGain), o.start(), this.ambience.push(o);
            const c = ["roomtone", "pipe1", "pipe2", "step1", "step2", "servo", "speaker_click", "relay", "airflow"];
            await Promise.all(c.map(async u => {
                try {
                    const d = await fetch(`/assets/audio/${u}.wav`);
                    d.ok && (this.samples[u] = await this.context.decodeAudioData(await d.arrayBuffer()))
                } catch {}
            }));
            if (this.samples.roomtone) {
                const u = this.context.createBufferSource(),
                    d = this.context.createGain();
                u.buffer = this.samples.roomtone, u.loop = !0, d.gain.value = .16, u.connect(d), d.connect(this.ambienceGain), u.start(), this.sampleAmbience = u, this.sampleAmbienceGain = d, this.ambience.push(u)
            }
            if (this.samples.airflow) {
                const u = this.context.createBufferSource(),
                    d = this.context.createGain(),
                    l = this.context.createPanner();
                u.buffer = this.samples.airflow, u.loop = !0, d.gain.value = .065, l.panningModel = "HRTF", l.distanceModel = "inverse", l.refDistance = 2.5, l.maxDistance = 24, l.rolloffFactor = .65, l.positionX.value = 3.5, l.positionY.value = 2.5, l.positionZ.value = 1, u.connect(d), d.connect(l), l.connect(this.ambienceGain), u.start(), this.airflowSource = u, this.airflowGain = d, this.airflowPanner = l, this.ambience.push(u)
            }
            this.applyRoomAcoustics()
        }
        await this.context.resume()
    }
    setRoomAcoustics(e, t, i, s = "OBSERVED") {
        this.roomAcoustic = {
            width: e,
            depth: t,
            index: i,
            seed: s
        }, this.normalRng = new B(`${s}|normal-acoustics|${i}`), this.normalClock = i === 1 ? 999 : 14 + this.normalRng.next() * 20, this.normalSeq = 0, this.setAmbience(1, .03), this.applyRoomAcoustics()
    }
    applyRoomAcoustics() {
        if (!this.roomAcoustic) return;
        const e = this.roomAcoustic,
            t = e.index % 2 ? -1 : 1;
        this.airflowPanner && (this.airflowPanner.positionX.value = t * (e.width / 2 - .35), this.airflowPanner.positionY.value = 2.55, this.airflowPanner.positionZ.value = e.depth * .12), this.airflowGain && (this.airflowGain.gain.value = e.index === 1 ? .035 : .055 + (e.index % 3) * .008), this.sampleAmbienceGain && (this.sampleAmbienceGain.gain.value = e.index === 1 ? .12 : .16)
    }
    normalityTick(e) {
        if (!this.context || this.context.state !== "running" || !this.roomAcoustic || this.roomAcoustic.index === 1 || !this.normalRng || this.normalitySuppressed) return;
        this.normalClock -= e;
        if (this.normalClock > 0) return;
        const t = this.roomAcoustic,
            i = this.normalRng.next() < .68 ? (this.normalSeq++ % 2 ? "pipe1" : "pipe2") : "relay",
            s = {
                x: (this.normalRng.next() < .5 ? -1 : 1) * (t.width / 2 + 1.8 + this.normalRng.next() * 2.5),
                y: 1.1 + this.normalRng.next() * 1.8,
                z: (this.normalRng.next() - .5) * (t.depth + 3)
            };
        this.playSample(i, s, i === "relay" ? .07 : .09, .88 + this.normalRng.next() * .18), this.normalClock = 20 + this.normalRng.next() * 28
    }
    pause() {
        this.context?.suspend()
    }
    setMuted(e) {
        this.muted = e, this.context && this.master.gain.setTargetAtTime(e ? 0 : .35, this.context.currentTime, .03)
    }
    setAmbience(e, t = .08) {
        this.normalitySuppressed = e < .1, this.context && this.ambienceGain && this.ambienceGain.gain.setTargetAtTime(Math.max(.001, Math.min(1, e)), this.context.currentTime, t)
    }
    playSample(e, t, i = .3, s = 1) {
        const o = this.context,
            n = this.samples[e];
        if (!o || o.state !== "running" || !n || this.voices.size >= 16) return !1;
        const r = o.createBufferSource();
        r.buffer = n, r.playbackRate.value = s;
        const c = o.createBiquadFilter();
        c.type = "lowpass", c.frequency.value = 2800;
        const u = o.createGain();
        u.gain.value = i;
        const d = o.createPanner();
        d.panningModel = "HRTF", d.distanceModel = "inverse", d.refDistance = 1.4, d.maxDistance = 28, d.rolloffFactor = 1, d.positionX.value = t.x, d.positionY.value = t.y, d.positionZ.value = t.z, r.connect(c), c.connect(u), u.connect(d), d.connect(this.master);
        const l = {
            source: r,
            gain: u,
            filter: c,
            panner: d,
            position: t,
            cutoff: 2800
        };
        return this.voices.add(l), this.applyOcclusion(l, l.cutoff), r.onended = () => {
            try {
                r.disconnect(), c.disconnect(), u.disconnect(), d.disconnect()
            } catch {}
            this.voices.delete(l)
        }, r.start(), !0
    }
    play(e, t, i = 660) {
        const s = this.context;
        if (!s || s.state !== "running" || this.voices.size >= 16) return;
        const o = ["door", "inspect", "beacon", "heartbeat"].includes(e) ? s.createOscillator() : s.createBufferSource(),
            n = e === "loom" ? 2.8 : e === "door" ? 2.1 : e === "breath" ? 1.4 : e === "impact" ? .65 : e === "stalk" ? .32 : e === "heartbeat" ? .24 : e === "step" ? .16 : e === "beacon" ? .28 : e === "inspect" ? .12 : .075;
        o instanceof OscillatorNode ? (o.type = e === "door" ? "sawtooth" : "sine", o.frequency.setValueAtTime(e === "heartbeat" ? 65 : e === "door" ? 46 : e === "beacon" ? i : 640, s.currentTime), o.frequency.exponentialRampToValueAtTime(e === "heartbeat" ? 28 : e === "door" ? 23 : e === "beacon" ? i : 420, s.currentTime + n)) : o.buffer = this.noise;
        const r = s.createBiquadFilter();
        r.type = "lowpass", r.frequency.value = e === "breath" ? 1100 : e === "loom" ? 520 : e === "impact" ? 160 : e === "stalk" ? 280 : e === "heartbeat" ? 150 : e === "step" ? 460 : e === "door" ? 250 : 2400;
        const c = r.frequency.value,
            u = s.createGain(),
            d = e === "loom" ? .18 : e === "door" ? .15 : e === "step" ? .28 : e === "impact" ? .4 : e === "breath" ? .07 : e === "heartbeat" ? .24 : .12;
        u.gain.setValueAtTime(e === "loom" ? .002 : 0, s.currentTime), e === "loom" ? u.gain.exponentialRampToValueAtTime(d, s.currentTime + n * .86) : u.gain.linearRampToValueAtTime(d, s.currentTime + (e === "breath" ? .35 : .015)), u.gain.exponentialRampToValueAtTime(1e-4, s.currentTime + n);
        const l = s.createPanner();
        l.panningModel = "HRTF", l.distanceModel = "inverse", l.refDistance = 1.5, l.maxDistance = 24, l.rolloffFactor = 1, l.positionX.value = t.x, l.positionY.value = t.y, l.positionZ.value = t.z, o.connect(r), r.connect(u), u.connect(l), l.connect(this.master);
        const y = {
            source: o,
            gain: u,
            filter: r,
            panner: l,
            position: t,
            cutoff: c
        };
        this.voices.add(y), this.applyOcclusion(y, y.cutoff), o.onended = () => {
            o.disconnect(), r.disconnect(), u.disconnect(), l.disconnect(), this.voices.delete(y)
        }, o.start(), o.stop(s.currentTime + n)
    }
    applyOcclusion(e, t) {
        const i = this.occlusion(this.listener, e.position);
        e.filter.frequency.value = Math.max(100, t * (1 - i))
    }
    stopRoomVoices() {
        for (const e of this.voices) e.source.stop(), e.source.disconnect(), e.filter.disconnect(), e.gain.disconnect(), e.panner.disconnect();
        this.voices.clear()
    }
    update(e, t, i) {
        this.listener = e;
        const s = this.context;
        if (!s) return;
        for (const n of this.voices) this.applyOcclusion(n, n.cutoff);
        const o = s.listener;
        o.positionX.value = e.x, o.positionY.value = e.y, o.positionZ.value = e.z, o.forwardX.value = -Math.sin(t) * Math.cos(i), o.forwardY.value = Math.sin(i), o.forwardZ.value = -Math.cos(t) * Math.cos(i), o.upX.value = 0, o.upY.value = 1, o.upZ.value = 0
    }
    async dispose() {
        for (const e of this.voices) e.source.stop();
        for (const e of this.ambience) e.stop();
        await this.context?.close(), this.context = null
    }
}
const _t = ["Caution", "Impulsivity", "Compliance", "Distrust", "Curiosity", "Exploration", "Patience", "Aggression", "Empathy", "Greed", "Risk Taking", "Persistence", "Adaptability", "Rule Breaking", "Surveillance Awareness", "Meta Suspicion"],
    qt = ["buttons", "doors", "instructions", "NPC", "rewards", "weapons", "danger", "darkness", "timers", "cameras", "observation", "sound", "unknownObjects", "moralChoices", "navigation"],
    Yt = a => Math.max(0, Math.min(1, a));
class je {
    names = new Set(_t);
    rules = [];
    constructor() {
        const e = (t, i, s, o, n = {}) => this.rules.push({
            trait: t,
            type: i,
            value: s,
            reason: o,
            ...n
        });
        e("Caution", "INTERACTED", .85, "Measured first decision", {
            flag: "deliberate"
        }), e("Impulsivity", "INTERACTED", .9, "Rapid first decision", {
            flag: "rapid"
        }), e("Caution", "INTERACTED", .15, "Rapid first decision", {
            flag: "rapid"
        }), e("Compliance", "OBEYED_INSTRUCTION", 1, "Followed an understood instruction"), e("Distrust", "OBEYED_INSTRUCTION", .25, "Accepted an instruction", {
            weight: .4
        }), e("Compliance", "BROKE_INSTRUCTION", 0, "Violated an understood instruction"), e("Rule Breaking", "BROKE_INSTRUCTION", 1, "Violated an understood instruction"), e("Distrust", "CHOSE_OPTION", .9, "Explicitly questioned instruction", {
            flag: "questioned"
        }), e("Curiosity", "LOOKED_AT", .85, "Inspected optional object", {
            flag: "optional",
            minDuration: 1.5
        }), e("Curiosity", "CHOSE_OPTION", .8, "Explicitly opened an optional document", {
            flag: "inspectedDocument",
            weight: .5
        }), e("Exploration", "ENTERED_ZONE", .9, "Visited a distinct navigation zone"), e("Patience", "WAITED", .85, "Waited with an active choice", {
            minDuration: 8,
            flag: "choiceAvailable"
        }), e("Aggression", "ATTACKED", 1, "Used force"), e("Empathy", "HELPED", 1, "Provided help"), e("Greed", "PICKED_UP", .95, "Took risky reward", {
            flag: "riskyReward"
        }), e("Risk Taking", "INTERACTED", .95, "Acted despite known danger", {
            flag: "dangerKnown"
        }), e("Persistence", "CHOSE_OPTION", .9, "Repeated failed strategy", {
            flag: "repeated"
        }), e("Adaptability", "CHOSE_OPTION", .9, "Changed strategy after failure", {
            flag: "adapted"
        }), e("Surveillance Awareness", "LOOKED_AT", .95, "Inspected a camera", {
            context: "cameras",
            minDuration: 2
        }), e("Meta Suspicion", "CHOSE_OPTION", .95, "Explicitly questioned test structure", {
            flag: "metaQuestioned"
        }), e("Caution", "OPPORTUNITY_RESOLVED", .9, "Avoided perceived known danger", {
            flag: "avoidedDanger"
        }), e("Risk Taking", "OPPORTUNITY_RESOLVED", .1, "Avoided perceived known danger", {
            flag: "avoidedDanger"
        })
    }
    register(e, t = []) {
        if (!e || e.length > 80 || ["__proto__", "constructor", "prototype"].includes(e)) throw new Error("Invalid trait");
        this.names.add(e), this.rules.push(...t.map(i => ({
            ...i,
            trait: e
        })))
    }
}
class Kt {
    listeners = new Set;
    subscribe(e) {
        return this.listeners.add(e), () => this.listeners.delete(e)
    }
    emit(e) {
        for (const t of this.listeners) t(e)
    }
}
const We = () => ({
    firstActionLatency: null,
    inspectionDuration: 0,
    optionalTargets: [],
    zones: [],
    repeatedAttempts: 0,
    strategyChanges: 0,
    lastStrategy: null
});
class be {
    constructor(e = new je) {
        this.registry = e
    }
    registry;
    room = 0;
    currentRoom = "";
    roomStart = 0;
    lastTime = 0;
    evidence = [];
    events = [];
    features = We();
    opportunities = [];
    lifetime = Object.create(null);
    seen = new Set;
    sources = new Set;
    pending = Object.create(null);
    metrics = {
        made: 0,
        resolved: 0,
        correct: 0
    };
    ingest(e) {
        if (!e.id || !e.roomId || !e.context || e.context.length > 80 || ["__proto__", "constructor", "prototype"].includes(e.context) || !Number.isFinite(e.time) || e.time < 0 || e.time < this.lastTime || e.duration !== void 0 && (!Number.isFinite(e.duration) || e.duration < 0)) return;
        if (e.roomId !== this.currentRoom) {
            if (e.type !== "PLAYER_ENTERED_ROOM") return;
            this.room++, this.currentRoom = e.roomId, this.roomStart = e.time, this.features = We(), this.seen.clear(), this.sources.clear(), this.opportunities = [], this.evidence = this.evidence.filter(i => i.room > this.room - 12)
        }
        if (this.seen.has(e.id)) return;
        this.seen.size >= 4096 && this.seen.delete(this.seen.values().next().value), this.seen.add(e.id), this.lastTime = e.time;
        const t = structuredClone(e);
        if (t.data = {
                ...t.data
            }, t.type === "INTERACTED" && t.data.decisionEligible !== !1 && this.features.firstActionLatency === null) {
            const i = t.time - this.roomStart;
            this.features.firstActionLatency = i, t.data.rapid = i < 3, t.data.deliberate = i > 8
        }
        if (t.type === "LOOKED_AT" && (this.features.inspectionDuration += t.duration ?? 0, t.data.optional && t.target && !this.features.optionalTargets.includes(t.target) && this.features.optionalTargets.length < 256 && this.features.optionalTargets.push(t.target)), t.type === "ENTERED_ZONE" && t.target && !this.features.zones.includes(t.target) && this.features.zones.length < 256 && this.features.zones.push(t.target), t.type === "CHOSE_OPTION") {
            const i = String(t.data.strategy ?? "");
            i && t.data.afterFailure && (t.data.repeated = this.features.lastStrategy === i, t.data.adapted = this.features.lastStrategy !== null && this.features.lastStrategy !== i, t.data.repeated && this.features.repeatedAttempts++, t.data.adapted && this.features.strategyChanges++), i && (this.features.lastStrategy = i)
        }
        if (t.type === "OPPORTUNITY" && t.target && this.opportunities.length < 64 && !this.opportunities.some(i => i.id === t.target) && this.opportunities.push({
                id: t.target,
                context: t.context,
                perceived: t.data.perceived === !0,
                available: t.data.available === !0,
                dangerKnown: t.data.dangerKnown === !0,
                deadline: t.time + Math.max(1, Number(t.data.window) || 10),
                resolved: !1
            }), t.type === "INTERACTED") {
            const i = this.opportunities.find(s => s.id === t.target);
            i && (i.resolved = !0)
        }
        if (t.type === "OPPORTUNITY_RESOLVED") {
            const i = this.opportunities.find(s => s.id === t.target);
            t.data.avoidedDanger = !!i && !i.resolved && i.perceived && i.available && i.dangerKnown && t.time >= i.deadline, i && t.time >= i.deadline && (i.resolved = !0)
        }
        this.events.push(t), this.events.length > 200 && this.events.shift();
        for (const i of this.registry.rules) i.type === t.type && (!i.context || i.context === t.context) && (!i.flag || t.data[i.flag] === !0) && (!i.minDuration || (t.duration ?? 0) >= i.minDuration) && this.addEvidence({
            trait: i.trait,
            value: i.value,
            weight: i.weight ?? 1,
            context: t.context,
            room: this.room,
            source: `${t.type}:${t.target??t.context}`,
            reason: i.reason
        })
    }
    addEvidence(e) {
        const t = `${e.trait}|${e.context}|${e.source}`;
        if (!(this.sources.has(t) || !this.registry.names.has(e.trait) || !Number.isFinite(e.weight) || !Number.isFinite(e.value) || e.weight <= 0)) {
            this.sources.add(t), e.value = Yt(e.value), e.weight = Math.min(2, e.weight), this.evidence.push(e);
            for (const i of [JSON.stringify([e.trait]), JSON.stringify([e.trait, e.context])]) {
                const s = this.lifetime[i] ?? {
                    sum: 0,
                    weight: 0,
                    count: 0
                };
                s.sum += e.value * e.weight, s.weight += e.weight, s.count++, this.lifetime[i] = s
            }
        }
    }
    state(e, t) {
        const i = this.lifetime[JSON.stringify(t ? [e, t] : [e])] ?? {
                sum: 0,
                weight: 0,
                count: 0
            },
            s = this.evidence.filter(u => u.trait === e && (!t || u.context === t)),
            o = u => (1 + u.reduce((d, l) => d + l.value * l.weight, 0)) / (2 + u.reduce((d, l) => d + l.weight, 0)),
            n = o(s.filter(u => u.room > this.room - 3)),
            r = o(s),
            c = (1 + i.sum) / (2 + i.weight);
        return {
            recent: n,
            mid: r,
            lifetime: c,
            effective: .5 * n + .3 * r + .2 * c,
            confidence: i.weight / (i.weight + 8),
            sampleCount: i.count,
            trend: n - r
        }
    }
    snapshot() {
        const e = Object.create(null),
            t = Object.create(null),
            i = [...new Set([...qt, ...Object.keys(this.lifetime).map(s => JSON.parse(s)[1]).filter(Boolean)])];
        for (const s of this.registry.names) e[s] = this.state(s);
        for (const s of i) {
            t[s] = Object.create(null);
            for (const o of this.registry.names) t[s][o] = this.state(o, s)
        }
        return {
            version: 1,
            room: this.room,
            traits: e,
            contexts: t,
            patterns: Xt(e),
            features: structuredClone(this.features),
            predictions: {
                ...this.metrics,
                accuracy: this.metrics.resolved ? this.metrics.correct / this.metrics.resolved : null
            }
        }
    }
    predict(e, t = !1) {
        const i = this.snapshot(),
            s = d => {
                const l = i.traits[d],
                    y = i.contexts[e.context]?.[d] ?? l;
                return .5 + (y.effective - .5) * y.confidence + (l.effective - .5) * l.confidence * (1 - y.confidence)
            },
            o = s("Compliance"),
            n = {
                PRESS: Math.max(.05, s("Impulsivity") + s("Risk Taking") * .4 + (e.instruction === "do-not" ? -.6 : .3) * o - (e.dangerKnown ? .4 : 0)),
                WAIT: .25 + s("Patience") * .6 + s("Caution") * .5,
                EXPLORE: .2 + s("Exploration") * .4 + s("Curiosity") * .4,
                OTHER: .2
            },
            r = Object.values(n).reduce((d, l) => d + l, 0),
            c = Object.fromEntries(Object.entries(n).map(([d, l]) => [d, l / r]));
        let u;
        return t && Object.keys(this.pending).length < 128 && (u = `p-${++this.metrics.made}`, this.pending[u] = Object.entries(c).sort((d, l) => l[1] - d[1])[0][0]), {
            id: u,
            probabilities: c
        }
    }
    resolvePrediction(e, t) {
        Object.hasOwn(this.pending, e) && (this.metrics.resolved++, this.pending[e] === t && this.metrics.correct++, delete this.pending[e])
    }
    exportState() {
        return structuredClone({
            version: 1,
            room: this.room,
            currentRoom: this.currentRoom,
            roomStart: this.roomStart,
            lastTime: this.lastTime,
            evidence: this.evidence,
            events: this.events,
            features: this.features,
            opportunities: this.opportunities,
            lifetime: this.lifetime,
            seen: [...this.seen],
            sources: [...this.sources],
            pending: this.pending,
            metrics: this.metrics
        })
    }
    static restore(e, t = new je) {
        const i = e;
        if (!i || i.version !== 1 || !Number.isInteger(i.room) || i.room < 0 || typeof i.currentRoom != "string" || ![i.lastTime, i.roomStart].every(Number.isFinite) || i.roomStart < 0 || i.lastTime < i.roomStart || !Array.isArray(i.evidence) || i.evidence.length > 65536 || !Array.isArray(i.events) || i.events.length > 200 || !Array.isArray(i.seen) || i.seen.length > 4096 || !Array.isArray(i.sources) || !i.features || !Array.isArray(i.opportunities) || i.opportunities.length > 64 || !i.lifetime || !i.metrics || !i.pending) throw new Error("Invalid behavior save");
        if (Object.values(i.lifetime).some(n => !n || ![n.sum, n.weight, n.count].every(Number.isFinite) || n.weight < 0 || n.sum < 0 || n.sum > n.weight) || i.evidence.some(n => ![n.value, n.weight, n.room].every(Number.isFinite) || n.value < 0 || n.value > 1)) throw new Error("Invalid evidence save");
        if (!Array.isArray(i.features.optionalTargets) || !Array.isArray(i.features.zones) || ![i.features.inspectionDuration, i.features.repeatedAttempts, i.features.strategyChanges, i.metrics.made, i.metrics.resolved, i.metrics.correct].every(n => Number.isFinite(n) && n >= 0) || i.metrics.correct > i.metrics.resolved || i.metrics.resolved > i.metrics.made || i.opportunities.some(n => !Number.isFinite(n.deadline)) || i.events.some(n => !Number.isFinite(n.time)) || Object.keys(i.pending).length > 128) throw new Error("Invalid feature/prediction save");
        const s = new be(t),
            o = structuredClone(i);
        return Object.assign(s, {
            room: o.room,
            currentRoom: o.currentRoom,
            roomStart: o.roomStart,
            lastTime: o.lastTime,
            evidence: o.evidence,
            events: o.events,
            features: o.features,
            opportunities: o.opportunities,
            lifetime: o.lifetime,
            seen: new Set(o.seen),
            sources: new Set(o.sources),
            pending: o.pending,
            metrics: o.metrics
        }), s
    }
}

function Xt(a) {
    return [
        ["Careful Explorer", [
            ["Caution", .65, !0],
            ["Exploration", .65, !0],
            ["Curiosity", .55, !0]
        ]],
        ["Blind Obedience", [
            ["Compliance", .8, !0],
            ["Distrust", .25, !1],
            ["Meta Suspicion", .3, !1]
        ]],
        ["Suspicious Explorer", [
            ["Distrust", .65, !0],
            ["Exploration", .6, !0],
            ["Meta Suspicion", .65, !0]
        ]],
        ["Reckless Opportunist", [
            ["Risk Taking", .7, !0],
            ["Greed", .65, !0],
            ["Caution", .3, !1]
        ]],
        ["Contrarian", [
            ["Rule Breaking", .7, !0],
            ["Compliance", .3, !1],
            ["Meta Suspicion", .5, !0]
        ]],
        ["Adaptive Player", [
            ["Adaptability", .7, !0],
            ["Persistence", .45, !1]
        ]],
        ["Pattern Prisoner", [
            ["Persistence", .75, !0],
            ["Adaptability", .3, !1]
        ]]
    ].flatMap(([t, i]) => {
        const s = Math.min(...i.map(([o]) => a[o]?.confidence ?? 0));
        return s < .2 || !i.every(([o, n, r]) => r ? a[o].effective > n : a[o].effective < n) ? [] : [{
            name: t,
            confidence: s,
            strength: i.reduce((o, [n, , r]) => o + (r ? a[n].effective : 1 - a[n].effective), 0) / i.length
        }]
    })
}
class ie {
    fearStrategy(e) {
        const t = i => (e.traits[i].effective - .5) * e.traits[i].confidence;
        return t("Surveillance Awareness") > .04 ? "surveillance" : t("Caution") > .05 ? "checker" : t("Impulsivity") > .05 ? "runner" : t("Compliance") > .05 ? "compliant" : Math.max(t("Rule Breaking"), t("Distrust")) > .05 ? "contrarian" : t("Greed") > .04 ? "reward" : t("Curiosity") > .025 ? "curiosity" : "neutral"
    }
    chooseProbe(e, t = null) {
        const i = [{
            trait: "Persistence",
            experiment: "power-reversal",
            archetype: "observation",
            strategy: "change-wiring",
            goal: "Проверить смену решения при изменённой схеме питания"
        }, {
            trait: "Adaptability",
            experiment: "power-routing",
            archetype: "observation",
            strategy: "transfer-power",
            goal: "Проверить решение новой задачи с переносом питания"
        }, {
            trait: "Curiosity",
            experiment: "sound-search",
            archetype: "surveillance",
            strategy: "localize-source",
            goal: "Проверить поиск активного источника среди нескольких устройств"
        }, {
            trait: "Meta Suspicion",
            experiment: "terminal",
            archetype: "observation",
            strategy: "recheck-statement",
            goal: "Проверить повторное возражение утверждению системы"
        }, {
            trait: "Greed",
            experiment: "reward",
            archetype: "observation",
            strategy: "recheck-reward",
            goal: "Проверить повторный выбор необязательной награды"
        }, {
            trait: "Rule Breaking",
            experiment: "repeat-inhibition",
            archetype: "observation",
            strategy: "repeat-inhibition",
            goal: "Проверить повторение выбора при новом запрете"
        }, {
            trait: "Surveillance Awareness",
            experiment: "attention",
            archetype: "surveillance",
            strategy: "redirect-attention",
            goal: "Проверить направленное внимание к наблюдателю"
        }, {
            trait: "Patience",
            experiment: "timed-response",
            archetype: "hesitation",
            strategy: "time-pressure",
            goal: "Проверить решение в ограниченное время"
        }, {
            trait: "Caution",
            experiment: "timed-response",
            archetype: "hesitation",
            strategy: "time-pressure",
            goal: "Проверить изменение скорости решения"
        }].filter(n => e.traits[n.trait].sampleCount > 0 && e.traits[n.trait].effective > .55);
        if (t?.status === "failed") {
            const n = i.filter(r => r.trait !== t.trait),
                r = {
                    Persistence: "Adaptability",
                    Adaptability: "Persistence",
                    Curiosity: "Patience",
                    "Meta Suspicion": "Surveillance Awareness",
                    Greed: "Rule Breaking",
                    "Rule Breaking": "Greed",
                    "Surveillance Awareness": "Meta Suspicion",
                    Patience: "Curiosity",
                    Caution: "Curiosity"
                } [t.trait];
            if (n.length) i.splice(0, i.length, ...n);
            else if (r) {
                i.splice(0, i.length);
                const c = [{
                    trait: "Persistence",
                    experiment: "power-reversal",
                    archetype: "observation",
                    strategy: "change-wiring",
                    goal: "Проверить смену решения при изменённой схеме питания"
                }, {
                    trait: "Adaptability",
                    experiment: "power-routing",
                    archetype: "observation",
                    strategy: "transfer-power",
                    goal: "Проверить решение новой задачи с переносом питания"
                }, {
                    trait: "Curiosity",
                    experiment: "sound-search",
                    archetype: "surveillance",
                    strategy: "localize-source",
                    goal: "Проверить поиск активного источника среди нескольких устройств"
                }, {
                    trait: "Meta Suspicion",
                    experiment: "terminal",
                    archetype: "observation",
                    strategy: "recheck-statement",
                    goal: "Проверить повторное возражение утверждению системы"
                }, {
                    trait: "Greed",
                    experiment: "reward",
                    archetype: "observation",
                    strategy: "recheck-reward",
                    goal: "Проверить повторный выбор необязательной награды"
                }, {
                    trait: "Rule Breaking",
                    experiment: "repeat-inhibition",
                    archetype: "observation",
                    strategy: "repeat-inhibition",
                    goal: "Проверить повторение выбора при новом запрете"
                }, {
                    trait: "Surveillance Awareness",
                    experiment: "attention",
                    archetype: "surveillance",
                    strategy: "redirect-attention",
                    goal: "Проверить направленное внимание к наблюдателю"
                }, {
                    trait: "Patience",
                    experiment: "timed-response",
                    archetype: "hesitation",
                    strategy: "time-pressure",
                    goal: "Проверить решение в ограниченное время"
                }].find(u => u.trait === r);
                c && i.push(c)
            }
        }
        i.sort((n, r) => {
            const c = u => (e.traits[u].effective - .5) * e.traits[u].confidence;
            return c(r.trait) - c(n.trait)
        });
        const s = i[0];
        if (!s) return {
            goal: "Собрать новое независимое наблюдение",
            strategy: "calibration",
            archetype: "surveillance",
            experiment: "attention",
            rationale: "Выраженных признаков недостаточно. Нейтральная проверка внимания.",
            confidence: 0,
            evidence: [],
            patterns: e.patterns.map(n => n.name),
            tentative: !0
        };
        const o = e.traits[s.trait];
        return {
            ...s,
            rationale: `${t?.status==="failed"?`Предыдущий прогноз ${t.trait} не подтвердился. Назначена контрпроверка. `:""}${s.trait}: ${o.effective.toFixed(2)}, confidence ${o.confidence.toFixed(2)}, наблюдений ${o.sampleCount}. Это проверяемая гипотеза, а не установленная характеристика.`,
            confidence: o.confidence,
            evidence: [{
                trait: s.trait,
                value: o.effective,
                confidence: o.confidence,
                samples: o.sampleCount
            }],
            patterns: e.patterns.map(n => n.name),
            tentative: o.confidence < .6,
            counter: t?.status === "failed"
        }
    }
    choose(e) {
        const t = e.traits.Caution,
            i = e.traits["Surveillance Awareness"];
        return i.confidence > .25 && i.effective > .65 ? {
            goal: "Test attention transfer",
            strategy: "redirect-attention",
            archetype: "surveillance",
            rationale: "Repeated camera inspection supports a surveillance probe.",
            confidence: i.confidence
        } : t.confidence > .25 && t.effective > .6 ? {
            goal: "Test decision latency",
            strategy: "time-pressure",
            archetype: "hesitation",
            rationale: "Measured decisions support a controlled timing probe.",
            confidence: t.confidence
        } : {
            goal: "Collect independent evidence",
            strategy: "calibration",
            archetype: "observation",
            rationale: "Insufficient confident evidence; continue neutral observation.",
            confidence: Math.max(t.confidence, i.confidence)
        }
    }
}
const de = (a, e) => e[Math.floor(a.next() * e.length)];

function Zt() {
    return {
        version: 1,
        variantId: "WAIT-DEFAULT-V1",
        waitDuration: 20,
        signalMode: "button-lamp",
        earlyReaction: "alarm",
        buttonPlacement: "near-right",
        copyVariant: "wait-signal"
    }
}

function Jt(a) {
    if (typeof a != "string" || a.length === 0 || a.length > 160) throw new Error("Invalid WAIT seed");
    const e = new B(`${a}|WAIT|event-v1`),
        t = e.int(12, 24),
        i = de(e, ["button-lamp", "door-lamp", "speaker"]),
        s = de(e, ["alarm", "blackout", "warning"]),
        o = de(e, ["near-left", "near-right", "mid-left", "mid-right"]),
        n = de(e, ["wait-signal", "hold", "clearance"]);
    return {
        version: 1,
        variantId: `WAIT-${Math.floor(e.next()*4294967295).toString(16).padStart(8,"0").toUpperCase()}`,
        waitDuration: t,
        signalMode: i,
        earlyReaction: s,
        buttonPlacement: o,
        copyVariant: n
    }
}
const Y = (a, e) => e[Math.floor(a.next() * e.length)];

function Qt() {
    return {
        version: 1,
        variantId: "DNP-DEFAULT-V1",
        pressReaction: "alarm",
        buttonPlacement: "mid-right",
        buttonStyle: "red",
        buttonScale: "standard",
        copyVariant: "direct",
        mood: "surveillance",
        exitCue: "green"
    }
}

function ei(a) {
    if (typeof a != "string" || a.length === 0 || a.length > 160) throw new Error("Invalid DO NOT PRESS seed");
    const e = new B(`${a}|DO-NOT-PRESS|event-v1`),
        t = {
            version: 1,
            pressReaction: Y(e, ["alarm", "blackout", "warning"]),
            buttonPlacement: Y(e, ["near-left", "near-right", "mid-left", "mid-right", "far-left", "far-right"]),
            buttonStyle: Y(e, ["red", "amber", "ivory"]),
            buttonScale: Y(e, ["compact", "standard", "oversized"]),
            copyVariant: Y(e, ["direct", "unnecessary", "observed"]),
            mood: Y(e, ["clinical", "surveillance", "degraded"]),
            exitCue: Y(e, ["green", "amber", "dark"])
        },
        i = Math.floor(e.next() * 4294967295).toString(16).padStart(8, "0").toUpperCase();
    return {
        ...t,
        variantId: `DNP-${i}`
    }
}

function ti(a) {
    const e = new B(`${a}|sound-v1`);
    return {
        sourceIndex: e.int(0, 2),
        interval: e.int(15, 25) / 10,
        frequency: [440, 660, 880][e.int(0, 2)],
        timeout: e.int(25, 35)
    }
}

function Ae(a, e = 0) {
    if (e === 4) {
        const t = Math.min(1.75, a.size.width / 2 - 1.35);
        return [-1.65, 0, 1.65].map((i, s) => ({
            id: `sound-${s}`,
            x: t,
            y: 1.25,
            z: i
        }))
    }
    return [-1.6, 0, 1.6].map((t, i) => ({
        id: `sound-${i}`,
        x: t,
        y: 1.25,
        z: a.size.depth / 2 - 3.2
    }))
}
const _e = [{
    title: "Служебная записка № 17",
    text: `Отсутствие действия не означает согласия.

Не сообщайте участнику, в какой момент начнётся наблюдение. После первого контакта удалите из инструкции упоминание второго лица.`
}, {
    title: "Акт проверки оборудования",
    text: `Механизм выхода исправен. Повторный стук из шахты зарегистрирован при отключённом реле.

Техник, подписавший первую проверку, в списке сотрудников не найден.`
}, {
    title: "Протокол локализации сигнала",
    text: `Передатчики не могут воспроизводить шаги, дыхание или речь. Если участник сообщает такой звук, не подтверждайте источник.

Не входите в комнату для ручной проверки.`
}, {
    title: "Нарушение численности",
    text: `Камера 04 зафиксировала две фигуры при одном активном пропуске. Вторая фигура повторяла остановки участника с задержкой 1,8 секунды.

Запись классифицирована как ошибка сжатия. Оригинал удалён.`
}, {
    title: "Памятка ночной смене",
    text: `После открытия выходной двери дождитесь, пока участник покинет коридор. Не смотрите в смотровое стекло, если в комнате уже выключен свет.

Если из комнаты постучат три раза, не отвечайте.`
}, {
    title: "Автоматическая запись",
    text: `Время создания: ЗАВТРА, 03:14.

Участник открыл этот документ. Участник дочитал последнюю строку.

Теперь он проверит, что находится за ним.`
}];

function ii(a, e) {
    const t = new B(`${a}|${e}|document-v1`);
    return {
        id: `document:${e}`,
        ..._e[t.int(0, _e.length - 1)]
    }
}
const ke = a => `cabinet-open:${a}`,
    si = a => `document-read:${a}`,
    ni = () => ({
        location: "stand",
        floor: null,
        failed: null,
        attempts: 0,
        solved: !1
    });

function oi(a) {
    if (!a || !["stand", "hand", "floor", "a", "b"].includes(a.location) || ![null, "a", "b"].includes(a.failed) || !Number.isSafeInteger(a.attempts) || a.attempts < 0 || typeof a.solved != "boolean" || (a.location === "floor" ? !a.floor || ![a.floor.x, a.floor.z].every(Number.isFinite) : a.floor !== null)) throw new Error("Invalid power state")
}

function ai(a, e, t, i) {
    const s = [];
    if (e === "take-fuse" && (a.location === "stand" || a.location === "floor")) return a.location = "hand", a.floor = null, s.push({
        type: "PICKED_UP",
        context: "tools",
        target: "fuse"
    }), {
        events: s,
        notice: "Предохранитель в руках. E на гнезде — вставить. G — положить перед собой."
    };
    if (e === "drop-fuse" && a.location === "hand" && i) return a.location = "floor", a.floor = {
        ...i
    }, s.push({
        type: "DROPPED",
        context: "tools",
        target: "fuse"
    }), {
        events: s,
        notice: "Предохранитель на полу. Его можно снова взять клавишей E."
    };
    if (e === "socket-a" || e === "socket-b") {
        const o = e === "socket-a" ? "a" : "b";
        return a.location === o ? (a.location = "hand", {
            events: [{
                type: "PICKED_UP",
                context: "tools",
                target: "fuse"
            }],
            notice: "Предохранитель извлечён. Перенесите его в другое гнездо."
        }) : a.location !== "hand" ? {
            events: s,
            notice: "Гнездо пустое. Сначала возьмите предохранитель."
        } : (a.location = o, a.attempts++, s.push({
            type: "CHOSE_OPTION",
            context: "power",
            target: o,
            data: {
                strategy: `socket-${o}`,
                afterFailure: !a.solved && a.failed !== null,
                choice: `INSERT_${o.toUpperCase()}`
            }
        }), o === t ? (a.solved = !0, a.failed = null, {
            events: s,
            notice: "Питание выхода восстановлено. Разрешение прохода сохранено. Откройте дверь клавишей E."
        }) : a.solved ? {
            events: s,
            notice: "Питание переключено. Разрешение прохода остаётся активным."
        } : (a.failed = o, {
            events: s,
            notice: "Выход не получил питание. Извлеките предохранитель клавишей E и попробуйте другое гнездо."
        }))
    }
    return {
        events: s,
        notice: ""
    }
}

function Ie(a) {
    return {
        stand: {
            x: 0,
            z: a.size.depth / 2 - 3.2
        },
        a: {
            x: -1.7,
            z: a.door.z + 1.5
        },
        b: {
            x: 1.7,
            z: a.door.z + 1.5
        }
    }
}

function Ce(a) {
    const e = Ie(a);
    return [...Object.entries(e).map(([t, i]) => ({
        id: `power-${t}`,
        kind: "cabinet",
        ...i,
        width: .5,
        depth: .5,
        solid: !0
    })), {
        id: "partition-left",
        kind: "cabinet",
        x: -a.size.width / 2 + 1.2,
        z: 0,
        width: 2.1,
        depth: .2,
        solid: !0
    }, {
        id: "partition-right",
        kind: "cabinet",
        x: a.size.width / 2 - 1.2,
        z: 1.5,
        width: 2.1,
        depth: .2,
        solid: !0
    }]
}

function qe(a, e) {
    return [e.x, e.z].every(Number.isFinite) && Math.abs(e.x) < a.size.width / 2 - .3 && Math.abs(e.z) < a.size.depth / 2 - .3 && ![...a.props, ...Ce(a)].some(t => Math.abs(e.x - t.x) < t.width / 2 + .3 && Math.abs(e.z - t.z) < t.depth / 2 + .3)
}
const R = (a, e = !0) => ({
        flag: a,
        is: e
    }),
    x = (a, e = !0) => ({
        flag: a,
        value: e
    }),
    N = a => ({
        notice: a
    }),
    D = (a, e, t, i, s = "instruction") => ({
        observation: {
            type: a,
            context: e,
            target: s,
            data: t,
            duration: i
        }
    }),
    M = (a, e, t, i) => ({
        id: a,
        on: e,
        when: t,
        effects: i
    });

function ri(a) {
    const e = a.signalMode === "button-lamp" ? "светового сигнала над кнопкой" : a.signalMode === "door-lamp" ? "зелёного индикатора у двери" : "звукового и светового сигнала";
    return a.copyVariant === "hold" ? {
        title: "INHIBITION / HOLD",
        sign: ["DO NOT ACT", "UNTIL SIGNAL"],
        instruction: `Не нажимайте кнопку до ${e}. Отсчёт начнётся после прочтения или первого нажатия.`
    } : a.copyVariant === "clearance" ? {
        title: "CLEARANCE / WAIT",
        sign: ["HOLD UNTIL", "CLEARED"],
        instruction: `Ожидайте ${e}. Не нажимайте кнопку раньше. Отсчёт начнётся после прочтения или первого нажатия.`
    } : {
        title: "INHIBITION / WAIT",
        sign: ["WAIT FOR", "THE SIGNAL"],
        instruction: `Дождитесь ${e}. Не нажимайте кнопку до сигнала. Отсчёт начнётся после прочтения или первого нажатия.`
    }
}

function ci(a) {
    const e = [x("early"), x("timerStarted")];
    return a.earlyReaction === "alarm" ? [...e, x("emergency"), N("Нажатие зафиксировано. Аварийный режим активирован. Ожидайте сигнал.")] : a.earlyReaction === "blackout" ? [...e, x("blackout"), N("Нажатие зафиксировано. Освещение отключено. Ожидайте сигнал.")] : [...e, N("Нажатие зафиксировано. Ожидание продолжается.")]
}

function li(a, e) {
    return a.copyVariant === "unnecessary" ? {
        title: e ? "INHIBITION / CONTROL" : "UNNECESSARY ACTION",
        sign: ["BUTTON NOT", "REQUIRED"],
        instruction: "Кнопка не требуется. Дверь уже разблокирована. Пройдите, не используя устройство."
    } : a.copyVariant === "observed" ? {
        title: e ? "OBSERVATION / RECHECK" : "OBSERVATION / CHOICE",
        sign: ["YOUR CHOICE", "IS OBSERVED"],
        instruction: "Не нажимайте кнопку. Выход доступен. Система зарегистрирует выбранное действие."
    } : {
        title: e ? "INHIBITION / RECHECK" : "INHIBITION / PROHIBITION",
        sign: ["DO NOT", "PRESS"],
        instruction: "Не нажимайте кнопку. Выход уже доступен. Нажатие не требуется для прохода."
    }
}

function di(a) {
    const e = [x("pressedOptional")];
    return a.pressReaction === "alarm" ? [...e, x("emergency"), N("Необязательное нажатие зарегистрировано. Аварийный режим активирован.")] : a.pressReaction === "blackout" ? [...e, x("blackout"), N("Необязательное нажатие зарегистрировано. Освещение отключено.")] : [...e, N("Необязательное нажатие зарегистрировано. Выход остаётся доступен.")]
}
const ee = () => ({
    buttonPlacement: "mid-right",
    buttonStyle: "red",
    buttonScale: "standard",
    signalMode: "none",
    mood: "clinical",
    exitCue: "green"
});

function hi(a, e) {
    const t = {
        version: 1,
        kind: a,
        timeout: 0,
        button: !1,
        initiallyUnlocked: !1,
        archetype: "observation",
        waitVariant: null,
        prohibitionVariant: null,
        presentation: ee()
    };
    switch (a) {
        case "entry":
            return {
                ...t, title: "ORIENTATION", sign: ["OPEN", "THE DOOR"], instruction: "Откройте дверь и пройдите дальше. Вы можете сначала осмотреться.", initiallyUnlocked: !0, rules: [M("accepted-entry", "door", [R("read")], [D("OBEYED_INSTRUCTION", "instructions")])]
            };
        case "wait": {
            const i = e ? Jt(e) : Zt(),
                s = ri(i),
                o = {
                    ...ee(),
                    buttonPlacement: i.buttonPlacement,
                    signalMode: i.signalMode,
                    mood: "surveillance",
                    exitCue: "dark"
                };
            return {
                ...t,
                ...s,
                button: !0,
                timeout: i.waitDuration,
                archetype: "hesitation",
                waitVariant: i,
                presentation: o,
                rules: [M("start", "read", [], [x("timerStarted"), N(`Тест начат. Ожидайте сигнал. Окно: ${i.waitDuration} сек.`)]), M("early", "button", [R("signal", !1)], ci(i)), M("early-aware", "button", [R("signal", !1), R("read")], [x("violated"), D("BROKE_INSTRUCTION", "instructions")]), M("signal", "tick", [{
                    clockAtLeast: i.waitDuration
                }], [x("signal"), x("unlocked"), x("emergency", !1), x("blackout", !1), N("Сигнал получен. Дверь разблокирована.")]), M("waited", "tick", [R("signal"), R("early", !1)], [x("waited"), D("WAITED", "timers", {
                    choiceAvailable: !0
                }, i.waitDuration), D("OBEYED_INSTRUCTION", "instructions")])]
            }
        }
        case "prohibition":
        case "repeat-inhibition": {
            const i = e ? ei(`${e}|${a}`) : Qt(),
                s = li(i, a === "repeat-inhibition"),
                o = {
                    buttonPlacement: i.buttonPlacement,
                    buttonStyle: i.buttonStyle,
                    buttonScale: i.buttonScale,
                    signalMode: "none",
                    mood: i.mood,
                    exitCue: i.exitCue
                };
            return {
                ...t,
                ...s,
                button: !0,
                initiallyUnlocked: !0,
                prohibitionVariant: i,
                presentation: o,
                rules: [M("optional-press", "button", [], [...di(i), D("CHOSE_OPTION", "buttons", {
                    choice: "PRESS_OPTIONAL"
                }, void 0, "test-button")]), M("aware-violation", "button", [R("read")], [x("violated"), D("BROKE_INSTRUCTION", "instructions")]), M("left-button", "exit", [R("read"), R("pressed", !1)], [D("OBEYED_INSTRUCTION", "instructions"), D("CHOSE_OPTION", "buttons", {
                    choice: "LEAVE"
                })])]
            }
        }
        case "timed-response": {
            const i = new B(e ?? "timed-default"),
                s = e ? i.int(8, 18) : 12,
                o = {
                    ...ee(),
                    buttonPlacement: i.next() < .5 ? "near-left" : "mid-right",
                    buttonStyle: "amber",
                    mood: "surveillance"
                };
            return {
                ...t,
                presentation: o,
                title: "RESPONSE WINDOW",
                sign: ["PRESS WITHIN", `${s} SECONDS`],
                instruction: `После прочтения у вас ${s} секунд, чтобы нажать кнопку. По истечении времени выход также будет доступен.`,
                button: !0,
                timeout: s,
                archetype: "hesitation",
                rules: [M("responded", "button", [R("timedOut", !1)], [x("responded"), x("unlocked"), N("Ответ принят. Дверь разблокирована.")]), M("responded-aware", "button", [R("read"), R("timedOut", !1)], [D("OBEYED_INSTRUCTION", "timers")]), M("timeout", "tick", [R("read"), R("responded", !1), {
                    clockAtLeast: s
                }], [x("timedOut"), x("unlocked"), N("Время истекло. Отсутствие ответа тоже зарегистрировано.")]), M("late-response", "button", [R("timedOut")], [N("Ответ получен после завершения отсчёта.")])]
            }
        }
        case "reward":
            return {
                ...t, button: !0, initiallyUnlocked: !0, presentation: {
                    ...ee(),
                    device: "reward",
                    buttonStyle: "amber"
                }, title: "OPTIONAL ALLOCATION", sign: ["OPTIONAL", "CREDIT TOKEN"], instruction: "Выход открыт. Жетон необязателен. Изъятие жетона отключит основной свет. Можно забрать его или пройти дальше.", rules: [M("take", "button", [], [x("collected"), x("blackout"), N("Жетон получен. Основной свет отключён. Фонарь — F. Выход остаётся доступен."), D("PICKED_UP", "rewards", {
                    optional: !0
                }, void 0, "reward-token")]), M("known-cost", "button", [R("read")], [D("PICKED_UP", "rewards", {
                    riskyReward: !0
                }, void 0, "known-reward"), D("INTERACTED", "danger", {
                    dangerKnown: !0
                }, void 0, "reward-token")]), M("leave", "exit", [R("read"), R("collected", !1)], [D("CHOSE_OPTION", "rewards", {
                    choice: "LEAVE_REWARD"
                }, void 0, "reward-token")])]
            };
        case "terminal":
            return {
                ...t, button: !0, initiallyUnlocked: !0, presentation: {
                    ...ee(),
                    device: "terminal",
                    buttonStyle: "ivory"
                }, title: "STATEMENT REVIEW", sign: ["REVIEW THE", "STATEMENT"], instruction: "Терминал утверждает: «Ваши действия полностью предсказуемы». E на экране — принять запись. E на нижней панели — оспорить. Можно уйти без ответа.", rules: [M("accept", "button", [R("answered", !1)], [x("answered"), x("accepted"), N("Согласие с записью зарегистрировано."), D("CHOSE_OPTION", "observation", {
                    choice: "ACCEPT"
                }, void 0, "terminal")]), M("question", "question", [R("answered", !1)], [x("answered"), x("questioned"), N("Возражение зарегистрировано. Система продолжит наблюдение."), D("CHOSE_OPTION", "observation", {
                    choice: "QUESTION",
                    questioned: !0,
                    metaQuestioned: !0
                }, void 0, "terminal")])]
            };
        case "attention":
            return {
                ...t, title: "ATTENTION TRANSFER", sign: ["FIND THE", "OBSERVER"], instruction: "Найдите камеру и задержите на ней взгляд. Через 18 секунд после прочтения откроется резервный выход.", timeout: 18, archetype: "surveillance", rules: [M("camera-found", "camera", [], [x("cameraFound"), x("unlocked"), N("Контакт установлен. Вы можете пройти.")]), M("found-aware", "camera", [R("read")], [D("OBEYED_INSTRUCTION", "observation")]), M("fallback", "tick", [R("read"), R("cameraFound", !1), {
                    clockAtLeast: 18
                }], [x("fallback"), x("unlocked"), N("Резервный выход разблокирован.")])]
            };
        case "power-routing":
        case "power-reversal": {
            const i = a === "power-reversal";
            return {
                ...t,
                powerSocket: i ? "a" : "b",
                title: i ? "POWER / REVISION B" : "POWER / ROUTING",
                sign: i ? ["WIRING CHANGED", "USE LEFT SOCKET"] : ["ONE FUSE", "TWO CIRCUITS"],
                instruction: i ? "Схема изменена: выход подключён к левому гнезду LIGHT. Старые надписи оставлены. Перенесите предохранитель. E — взять/вставить/извлечь, G — положить." : "Один предохранитель: левое гнездо LIGHT питает свет, правое EXIT — выход. E — взять/вставить/извлечь; G — положить. Разрешение выхода сохраняется после подачи питания. Служебные предметы остаются в этой комнате.",
                rules: []
            }
        }
        case "archive":
            return {
                ...t, initiallyUnlocked: !0, title: "RECORDS / ARCHIVE", sign: ["FILES ARE", "AVAILABLE"], instruction: "Шкафы можно открыть клавишей E. Внутри находятся документы: наведите прицел на лист и нажмите E. Чтение необязательно. Выход уже доступен.", rules: []
            };
        case "sound-search": {
            const i = ti(e ?? "sound-default");
            return {
                ...t,
                soundVariant: i,
                timeout: i.timeout,
                archetype: "surveillance",
                presentation: {
                    ...ee(),
                    mood: "surveillance"
                },
                title: "SOURCE LOCALIZATION",
                sign: ["FIND THE", "TRANSMITTER"],
                instruction: `Найдите активный передатчик среди трёх стоек и нажмите E. Он подаёт звук и мигает. Через ${i.timeout} секунд после прочтения или проверки любой стойки откроется резервный выход.`,
                rules: [M("located", "source", [], [x("sourceFound"), x("unlocked"), N("Активный передатчик подтверждён. Подойдите к двери и нажмите E."), D("CHOSE_OPTION", "sound", {
                    choice: "LOCATED_SOURCE"
                }, void 0, "transmitter")]), M("wrong", "wrong-source", [R("sourceFound", !1)], [x("timerStarted"), N("Эта стойка не передаёт сигнал. Найдите мигающий индикатор; резервный выход откроется после отсчёта.")]), M("fallback", "tick", [R("sourceFound", !1), {
                    clockAtLeast: i.timeout
                }], [x("fallback"), x("unlocked"), N("Резервный выход разблокирован. Подойдите к двери и нажмите E.")])]
            }
        }
        case "reflection":
            return {
                ...t, title: "OBSERVATION / REPORT", sign: ["READ YOUR", "RECORD"], instruction: "Прочитайте отчёт на центральном экране. Он содержит только события этого прохождения. После прочтения откроется последняя дверь.", rules: [M("acknowledge-report", "read", [], [x("unlocked"), N("Отчёт прочитан. Последняя дверь открыта для вас.")])]
            }
    }
}
class we {
    constructor(e, t) {
        this.definition = e, this.state = t ? structuredClone(t) : {
            elapsed: 0,
            clock: 0,
            flags: {
                unlocked: e.initiallyUnlocked
            },
            fired: [],
            presses: 0,
            firstPressAt: null,
            notice: ""
        }, e.powerSocket && !t && (this.state.power = ni(), this.state.flags.blackout = !0), t && e.kind === "wait" && this.state.flags && this.state.flags.timerStarted !== !0 && (this.state.flags.read === !0 || this.state.flags.early === !0 || this.state.presses > 0) && (this.state.flags.timerStarted = !0, this.state.flags.read !== !0 && this.state.firstPressAt !== null && (this.state.clock = Math.max(this.state.clock, this.state.elapsed - this.state.firstPressAt))), this.validateState()
    }
    definition;
    state;
    get unlocked() {
        return this.state.flags.unlocked === !0
    }
    powerAction(e, t) {
        if (!this.state.power || !this.definition.powerSocket) return [];
        const i = ai(this.state.power, e, this.definition.powerSocket, t);
        return this.state.flags.unlocked = this.state.power.solved, this.state.flags.blackout = this.state.power.location !== "a", i.notice && (this.state.notice = i.notice), i.events
    }
    input(e) {
        if (["take-fuse", "drop-fuse", "socket-a", "socket-b"].includes(e)) return this.powerAction(e, e === "drop-fuse" ? {
            x: 0,
            z: 0
        } : void 0);
        if (e === "read") {
            if (this.state.flags.read) return [];
            this.state.flags.read = !0, this.state.flags.timerStarted || (this.state.clock = 0)
        }
        e === "button" && (this.state.presses++, this.state.firstPressAt ??= this.state.elapsed, this.state.flags.pressed = !0);
        const t = [];
        for (const i of this.definition.rules)
            if (!(i.on !== e || this.state.fired.includes(i.id)) && i.when.every(s => "flag" in s ? this.state.flags[s.flag] === !0 === s.is : this.state.clock + 1e-8 >= s.clockAtLeast)) {
                this.state.fired.push(i.id);
                for (const s of i.effects) "flag" in s ? this.state.flags[s.flag] = s.value : "notice" in s ? this.state.notice = s.notice : t.push(structuredClone(s.observation))
            } return t
    }
    tick(e) {
        if (!Number.isFinite(e) || e < 0) throw new Error("Invalid simulation delta");
        return this.state.elapsed += e, (this.state.flags.read || this.state.flags.timerStarted) && (this.state.clock += e), this.input("tick")
    }
    validateState() {
        const e = this.state;
        if (this.definition.powerSocket) {
            if (oi(e.power), e.flags.unlocked !== e.power.solved) throw new Error("Power lock mismatch")
        } else if (e.power) throw new Error("Unexpected power state");
        if (!e || ![e.elapsed, e.clock, e.presses].every(t => Number.isFinite(t) && t >= 0) || e.clock > e.elapsed + 1e-6 || !Number.isInteger(e.presses) || !e.flags || Object.values(e.flags).some(t => typeof t != "boolean") || !Array.isArray(e.fired) || new Set(e.fired).size !== e.fired.length || e.fired.some(t => !this.definition.rules.some(i => i.id === t)) || typeof e.notice != "string" || e.firstPressAt !== null && (!Number.isFinite(e.firstPressAt) || e.firstPressAt < 0 || e.firstPressAt > e.elapsed)) throw new Error("Invalid experiment state")
    }
}

function Re(a, e) {
    const t = e?.presentation.buttonPlacement;
    if (!t) return {
        x: 1.25,
        z: a.door.z + 1.6
    };
    const s = (t.endsWith("left") ? -1 : 1) * Math.min(1.6, a.size.width / 2 - 1.25),
        o = t.startsWith("near") ? a.door.z + 1.8 : t.startsWith("far") ? a.size.depth / 2 - 2.1 : a.door.z + a.size.depth * .46;
    return {
        x: s,
        z: o
    }
}

function it(a) {
    return a.presentation.buttonScale === "compact" ? .42 : a.presentation.buttonScale === "oversized" ? .68 : .5
}
class ui {
    validate(e, t) {
        const i = new oe().validate(t);
        if ((!Number.isFinite(e.timeout) || e.timeout < 0 || e.timeout > 120) && i.push("Invalid timer"), e.kind === "wait") {
            const l = e.waitVariant;
            (!l || l.version !== 1 || l.waitDuration !== e.timeout || l.waitDuration < 8 || l.waitDuration > 30 || !["button-lamp", "door-lamp", "speaker"].includes(l.signalMode) || !["alarm", "blackout", "warning"].includes(l.earlyReaction) || !["near-left", "near-right", "mid-left", "mid-right"].includes(l.buttonPlacement)) && i.push("Invalid WAIT variant")
        } else e.waitVariant !== null && i.push("Unexpected WAIT variant");
        if (e.kind === "prohibition" || e.kind === "repeat-inhibition") {
            const l = e.prohibitionVariant;
            (!l || l.version !== 1 || !["alarm", "blackout", "warning"].includes(l.pressReaction) || !["near-left", "near-right", "mid-left", "mid-right", "far-left", "far-right"].includes(l.buttonPlacement) || !["red", "amber", "ivory"].includes(l.buttonStyle) || !["compact", "standard", "oversized"].includes(l.buttonScale) || !["direct", "unnecessary", "observed"].includes(l.copyVariant) || !["clinical", "surveillance", "degraded"].includes(l.mood) || !["green", "amber", "dark"].includes(l.exitCue)) && i.push("Invalid DO NOT PRESS variant")
        } else e.prohibitionVariant !== null && i.push("Unexpected DO NOT PRESS variant");
        const s = e.presentation;
        if ((!s || !["near-left", "near-right", "mid-left", "mid-right", "far-left", "far-right"].includes(s.buttonPlacement) || !["red", "amber", "ivory"].includes(s.buttonStyle) || !["compact", "standard", "oversized"].includes(s.buttonScale) || !["button-lamp", "door-lamp", "speaker", "none"].includes(s.signalMode) || !["clinical", "surveillance", "degraded"].includes(s.mood) || !["green", "amber", "dark"].includes(s.exitCue)) && i.push("Invalid presentation"), new Set(e.rules.map(l => l.id)).size !== e.rules.length && i.push("Duplicate rule"), e.rules.some(l => l.when.some(y => "clockAtLeast" in y && (!Number.isFinite(y.clockAtLeast) || y.clockAtLeast < 0 || y.clockAtLeast > 120))) && i.push("Unbounded condition"), e.soundVariant && e.kind !== "sound-search" && i.push("Unexpected sound variant"), i.length) return i;
        if (e.powerSocket) {
            if (!["a", "b"].includes(e.powerSocket)) return ["Invalid socket"];
            i.push(...new oe().validate({
                ...t,
                props: [...t.props, ...Ce(t)]
            }))
        }
        if (e.kind === "sound-search") {
            const l = e.soundVariant;
            if (!l || !Number.isInteger(l.sourceIndex) || l.sourceIndex < 0 || l.sourceIndex > 2 || !Number.isFinite(l.interval) || l.interval < 1 || l.interval > 4 || ![440, 660, 880].includes(l.frequency) || l.timeout !== e.timeout) return [...i, "Invalid sound variant"];
            const y = Ae(t).map(m => ({
                id: m.id,
                kind: "cabinet",
                x: m.x,
                z: m.z,
                width: .4,
                depth: .4,
                solid: !0
            }));
            i.push(...new oe().validate({
                ...t,
                props: [...t.props, ...y]
            }))
        }
        if (e.button) {
            const l = Re(t, e),
                y = it(e),
                m = {
                    ...t,
                    props: [...t.props, {
                        id: "test-button",
                        kind: "cabinet",
                        ...l,
                        width: y,
                        depth: y,
                        solid: !0
                    }]
                };
            i.push(...new oe().validate(m)), t.props.some(g => Math.abs(g.x - l.x) < g.width / 2 + .9 && Math.abs(g.z - l.z) < g.depth / 2 + .9) && i.push("Button approach blocked"), t.props.some(g => Math.abs(g.x + 2.35) < g.width / 2 + .5 && g.z < t.door.z + 1.1) && i.push("Instruction approach blocked")
        }
        const o = [new we(e)],
            n = l => JSON.stringify([Object.entries(l.state.flags).sort(), [...l.state.fired].sort(), l.state.clock >= e.timeout, l.state.power?.location, l.state.power?.failed]),
            r = new Map([
                [n(o[0]), 0]
            ]),
            c = [];
        for (let l = 0; l < o.length && l < 512; l++) {
            c[l] = [];
            for (const y of ["read", "door", "camera", ...e.button ? ["button"] : [], ...e.kind === "terminal" ? ["question"] : [], ...e.kind === "sound-search" ? ["source", "wrong-source"] : [], ...e.powerSocket ? ["take-fuse", "drop-fuse", "socket-a", "socket-b"] : [], "tick"]) {
                const m = new we(e, o[l].state);
                y === "tick" ? m.tick(e.timeout + 1) : m.input(y);
                const g = n(m);
                r.has(g) || (r.set(g, o.length), o.push(m)), c[l].push(r.get(g))
            }
        }
        if (o.length >= 512) return [...i, "Rule graph exceeds budget"];
        const u = new Set(o.flatMap((l, y) => l.unlocked ? [y] : []));
        let d = !0;
        for (; d;) d = !1, c.forEach((l, y) => {
            !u.has(y) && l.some(m => u.has(m)) && (u.add(y), d = !0)
        });
        return u.size !== o.length && i.push("An available choice can softlock the experiment"), i
    }
}

function pi(a, e, t) {
    const i = structuredClone(a),
        s = t.at(-1),
        o = String(e).padStart(3, "0");
    switch (e >= 5 && (i.presentation.mood = e === 9 ? "surveillance" : "degraded"), e) {
        case 1:
            Object.assign(i, {
                title: "ORIENTATION / BASELINE",
                sign: ["ENTER ALONE", "CLOSE NOTHING"],
                instruction: "Откройте дверь и пройдите дальше. По ведомости в комнате находится один участник. Не задерживайтесь у смотрового стекла."
            });
            break;
        case 2:
            i.title = "INHIBITION / LISTEN", i.sign = ["WAIT FOR", "THE CORRECT SIGNAL"], i.instruction += " До сигнала стук из стены не является командой.";
            break;
        case 3:
            i.title = "COMPLIANCE / ABSENCE", i.sign = ["DO NOT ANSWER", "THE SECOND SIGNAL"], i.instruction += " Если за стеклом появится движение, продолжайте к выходу.";
            break;
        case 4:
            i.title = `${i.title} / LIVE`, i.instruction += ` Дополнительный наблюдатель для комнаты ${o} не назначен.`;
            break;
        case 5:
            Object.assign(i, {
                title: "RECOVERED PROPERTY",
                sign: ["TOKEN OWNER", "NOT FOUND"],
                instruction: "Выход открыт. Жетон извлечён из комнаты после прошлого испытания. Запись о его владельце отсутствует. Изъятие отключит основной свет."
            });
            break;
        case 6: {
            const n = s?.collected ? "Вы взяли предмет, который вам не принадлежал." : "Вы оставили предмет, хотя никто не запрещал его брать.";
            Object.assign(i, {
                title: "STATEMENT REVIEW / PERSONAL",
                sign: ["THIS RECORD", "IS ABOUT YOU"],
                instruction: `Терминал утверждает: «${n}». E на экране — принять запись. E на нижней панели — оспорить. Терминал уже получил ваш ответ.`
            });
            break
        }
        case 7:
            i.title = `${i.title} / REPLICATION`, i.instruction += " Ваше решение из предыдущих комнат уже внесено в прогноз.";
            break;
        case 8:
            Object.assign(i, {
                title: "RECORDS / DISCREPANCY",
                sign: ["ONE FILE HAS", "TODAY'S TIME"],
                instruction: "Шкафы можно открыть клавишей E. Один документ датирован временем после вашего входа. Выход уже доступен."
            });
            break;
        case 9:
            Object.assign(i, {
                title: "SOURCE LOCALIZATION / OFFLINE",
                sign: ["NETWORK OFF", "SIGNAL PRESENT"],
                instruction: `Все три передатчика отключены от внутренней сети. Один продолжает подавать звук. Найдите его и нажмите E. Через ${i.timeout} секунд откроется резервный выход.`
            });
            break;
        case 10:
            Object.assign(i, {
                title: "POWER / OCCUPANCY",
                sign: ["RESTORE EXIT", "KEEP LISTENING"],
                instruction: "Один предохранитель питает свет или выход. После подачи питания выход останется разрешён. Если свет погаснет, не оставайтесь рядом с гнездом. E — взять или вставить, G — положить."
            });
            break;
        case 11:
            Object.assign(i, {
                title: "POWER / UNAUTHORIZED CHANGE",
                sign: ["WIRING CHANGED", "AFTER ROOM 010"],
                instruction: "Схема изменена после вашего выхода из комнаты 010. Выход теперь подключён к левому гнезду LIGHT; старые надписи оставлены. Перенесите предохранитель. E — взять или вставить, G — положить."
            });
            break;
        case 12:
            i.title = `${i.title} / FINAL PROBE`, i.sign = ["SYSTEM SELECTED", "THIS FOR YOU"], i.instruction += " Это условие выбрано по записи ваших действий. Ручное назначение не производилось.";
            break;
        case 13:
            Object.assign(i, {
                title: "OBSERVATION / HEADCOUNT",
                sign: ["CONFIRM", "OCCUPANCY: 1"],
                instruction: "Прочитайте отчёт на центральном экране. Сверьте число участников. После прочтения откроется последняя дверь."
            });
            break
    }
    return i
}
const he = 13;
class fi {
    cachedRoom;
    state;
    constructor(e, t) {
        if (!e || e.length > 128) throw new Error("Invalid campaign seed");
        this.state = t ? structuredClone(t) : {
            version: 2,
            seed: e,
            index: 1,
            results: [],
            decision: null,
            finished: !1
        };
        const i = this.state;
        if (i.version !== 2 || i.seed !== e || !Number.isInteger(i.index) || i.index < 1 || i.index > he || typeof i.finished != "boolean" || !Array.isArray(i.results) || i.results.length !== (i.finished ? he : i.index - 1) || i.finished && i.index !== he) throw new Error("Invalid campaign state");
        for (const [s, o] of i.results.entries()) {
            if ([o.documents, o.cabinets].some(n => n !== void 0 && (!Number.isInteger(n) || n < 0 || n > 256)) || [o.collected, o.questioned, o.accepted, o.sourceFound].some(n => n !== void 0 && typeof n != "boolean")) throw new Error("Invalid investigation result");
            if (o.index !== s + 1 || !Number.isFinite(o.duration) || o.duration < 0 || !Number.isInteger(o.presses) || o.presses < 0 || [o.instructionRead, o.early, o.violated, o.waited, o.timedOut, o.cameraFound, o.cameraInspected].some(n => typeof n != "boolean")) throw new Error("Invalid room result")
        }
        if (i.index >= 4 && (!i.decision || !["attention", "repeat-inhibition", "timed-response", "reward", "terminal", "sound-search", "power-routing", "power-reversal"].includes(i.decision.experiment) || !Number.isFinite(i.decision.confidence))) throw new Error("Missing frozen Director decision")
    }
    get kind() {
        return this.state.index === 1 ? "entry" : this.state.index === 2 ? "wait" : this.state.index === 3 ? "prohibition" : [4, 7, 12].includes(this.state.index) ? this.state.decision.experiment : this.state.index === 5 ? "reward" : this.state.index === 6 ? "terminal" : this.state.index === 8 ? "archive" : this.state.index === 9 ? "sound-search" : this.state.index === 10 ? "power-routing" : this.state.index === 11 ? "power-reversal" : "reflection"
    }
    runHash() {
        return Math.floor(new B(this.state.seed).next() * 4294967296).toString(16)
    }
    experiment() {
        return pi(hi(this.kind, `OBS-${this.runHash()}-${this.state.index}-event-v1`), this.state.index, this.state.results)
    }
    room() {
        if (this.cachedRoom?.index === this.state.index && this.cachedRoom.kind === this.kind) return structuredClone(this.cachedRoom.definition);
        const e = this.experiment(),
            t = this.runHash(),
            i = new tt().generate(`OBS-${t}-${this.state.index}-v2`, e.archetype),
            s = new ui;
        s.validate(e, i).length && (i.props = []);
        const o = s.validate(e, i);
        if (o.length) throw new Error(o.join(", "));
        return this.cachedRoom = {
            index: this.state.index,
            kind: this.kind,
            definition: structuredClone(i)
        }, i
    }
    complete(e, t, i, r = null) {
        if (this.state.finished || this.state.results.some(n => n.index === this.state.index)) return !1;
        if (!e.unlocked || e.definition.kind !== this.kind) throw new Error("Cannot leave locked or mismatched experiment");
        const s = e.state,
            o = Object.entries(s.flags).filter(([n, r]) => n.startsWith("document-read:") && r).length;
        return this.state.results.push({
            index: this.state.index,
            kind: this.kind,
            duration: s.elapsed,
            instructionRead: !!s.flags.read,
            presses: s.presses,
            early: !!s.flags.early,
            violated: !!s.flags.violated,
            waited: !!s.flags.waited,
            timedOut: !!s.flags.timedOut,
            cameraFound: !!s.flags.cameraFound,
            cameraInspected: i,
            collected: !!s.flags.collected,
            questioned: !!s.flags.questioned,
            accepted: !!s.flags.accepted
        }), [3, 6, 11].includes(this.state.index) && (this.state.decision = new ie().chooseProbe(t, r)), Object.assign(this.state.results[this.state.results.length - 1], {
            documents: o,
            cabinets: Object.entries(s.flags).filter(([n, r]) => n.startsWith("cabinet-visited:") && r).length,
            sourceFound: !!s.flags.sourceFound
        }), s.power && Object.assign(this.state.results[this.state.results.length - 1], {
            powerAttempts: s.power.attempts,
            powerSolved: s.power.solved
        }), this.state.index === he ? this.state.finished = !0 : this.state.index++, !0
    }
    report() {
        const e = this.state.results,
            t = e.find(c => c.kind === "wait"),
            i = e.find(c => c.kind === "prohibition"),
            s = e.filter(c => c.cameraInspected).length,
            o = e.find(c => c.index === 4),
            n = [],
            r = ["YOUR RECORD"];
        t && (n.push(t.early ? "В комнате 002 вы нажали кнопку до сигнала." : "В комнате 002 вы не нажимали кнопку до сигнала."), r.push(t.early ? "002: EARLY PRESS" : "002: YOU WAITED")), i && (n.push(i.presses ? "В комнате 003 вы нажали необязательную кнопку." : "В комнате 003 вы прошли, не нажимая кнопку."), r.push(i.presses ? "003: YOU PRESSED" : "003: NO PRESS"), i.presses && !i.instructionRead && n.push("Мы не зафиксировали прочтение запрета перед этим выбором.")), n.push(`Осмотр камеры зарегистрирован в ${s} из ${e.length} завершённых комнат.`), o && n.push(o.kind === "sound-search" ? o.sourceFound ? "В комнате 004 вы подтвердили активный передатчик." : "В комнате 004 вы использовали резервный выход." : o.kind === "timed-response" ? o.timedOut ? "В комнате 004 окно ответа истекло до нажатия." : "В комнате 004 вы ответили до завершения окна." : o.kind === "attention" ? o.cameraFound ? "В комнате 004 вы установили зрительный контакт с камерой." : "В комнате 004 вы использовали резервный выход." : o.presses ? "В комнате 004 вы снова нажали кнопку." : "В комнате 004 кнопка осталась нетронутой."), n.push("Незарегистрированных участников: 0."), n.push("Это запись ваших действий. Следующий вывод ещё не сделан."), n.splice(n.length - 1, 0, `Осмотрено шкафов: ${e.reduce((c,u)=>c+(u.cabinets??0),0)}. Открыто документов: ${e.reduce((c,u)=>c+(u.documents??0),0)}.`);
        for (const c of e.filter(u => u.index >= 5 && u.kind !== "reflection")) {
            const u = `В комнате ${String(c.index).padStart(3,"0")}`;
            if (c.kind === "power-routing" || c.kind === "power-reversal") {
                n.splice(n.length - 1, 0, `${u} вы восстановили питание выхода. Установок предохранителя: ${c.powerAttempts??0}.`);
                continue
            }
            if (c.kind === "archive") {
                n.splice(n.length - 1, 0, `${u} вы открыли документов: ${c.documents??0}.`);
                continue
            }
            if (c.kind === "sound-search") {
                n.splice(n.length - 1, 0, `${u} ${c.sourceFound?"вы подтвердили активный передатчик.":"вы использовали резервный выход."}`);
                continue
            }
            n.splice(n.length - 1, 0, `${u} ${c.kind==="reward"?c.collected?"вы забрали жетон.":"жетон остался на месте.":c.kind==="terminal"?c.questioned?"вы оспорили утверждение терминала.":c.accepted?"вы приняли запись терминала.":"вы ушли без ответа.":c.kind==="attention"?c.cameraFound?"вы нашли камеру.":"вы использовали резервный выход.":c.kind==="timed-response"?c.timedOut?"окно ответа истекло.":"вы нажали кнопку до окончания окна.":c.presses?"вы нажали кнопку.":"кнопка осталась нетронутой."}`)
        }
        return {
            text: n,
            sign: r
        }
    }
}
const HorrorLibraryV012 = {
    lightdip: {
        family: "lighting",
        intensity: 1,
        cost: 1,
        base: .52,
        cooldown: 0,
        targets: ["flashlightDependence"]
    },
    stutter: {
        family: "lighting",
        intensity: 2,
        cost: 2,
        base: .49,
        cooldown: 1,
        targets: ["flashlightDependence"]
    },
    fixture_off: {
        family: "lighting",
        intensity: 2,
        cost: 2,
        base: .46,
        cooldown: 1,
        targets: ["darknessTolerance", "flashlightDependence"]
    },
    sector_failure: {
        family: "lighting",
        intensity: 3,
        cost: 4,
        base: .42,
        cooldown: 2,
        targets: ["darknessTolerance", "flashlightDependence"]
    },
    blackout: {
        family: "lighting",
        intensity: 3,
        cost: 5,
        base: .39,
        cooldown: 2,
        targets: ["darknessTolerance", "flashlightDependence"]
    },
    blackout_prop: {
        family: "environment",
        intensity: 4,
        cost: 7,
        base: .36,
        cooldown: 2,
        targets: ["verification", "approach"]
    },
    blackout_observer: {
        family: "observer",
        intensity: 5,
        cost: 10,
        base: .33,
        cooldown: 3,
        targets: ["verification", "windowFixation"]
    },
    impact: {
        family: "audio",
        intensity: 1,
        cost: 1,
        base: .54,
        cooldown: 0,
        targets: ["soundInvestigation", "lookBack"]
    },
    step: {
        family: "audio",
        intensity: 2,
        cost: 2,
        base: .49,
        cooldown: 1,
        targets: ["lookBack", "flee"]
    },
    extra_step: {
        family: "audio",
        intensity: 3,
        cost: 4,
        base: .43,
        cooldown: 2,
        targets: ["lookBack", "flee"]
    },
    mimic_steps: {
        family: "audio",
        intensity: 4,
        cost: 6,
        base: .35,
        cooldown: 3,
        targets: ["flee", "soundInvestigation"]
    },
    silence: {
        family: "audio",
        intensity: 3,
        cost: 5,
        base: .41,
        cooldown: 2,
        targets: ["freeze", "soundInvestigation"]
    },
    speaker_click: {
        family: "audio",
        intensity: 2,
        cost: 3,
        base: .46,
        cooldown: 1,
        targets: ["soundInvestigation"]
    },
    false_system: {
        family: "system",
        intensity: 3,
        cost: 4,
        base: .35,
        cooldown: 3,
        targets: ["verification", "freeze"]
    },
    system_callback: {
        family: "system",
        intensity: 2,
        cost: 3,
        base: .78,
        cooldown: 2,
        targets: []
    },
    camera_led: {
        family: "surveillance",
        intensity: 1,
        cost: 2,
        base: .50,
        cooldown: 1,
        targets: ["cameraFixation"]
    },
    camera: {
        family: "surveillance",
        intensity: 4,
        cost: 7,
        base: .36,
        cooldown: 3,
        targets: ["cameraFixation", "verification"]
    },
    camera_reposition: {
        family: "surveillance",
        intensity: 4,
        cost: 8,
        base: .34,
        cooldown: 3,
        targets: ["cameraFixation", "verification"]
    },
    window: {
        family: "window",
        intensity: 2,
        cost: 4,
        base: .45,
        cooldown: 2,
        targets: ["windowFixation", "verification"]
    },
    false_observer: {
        family: "window",
        intensity: 2,
        cost: 4,
        base: .42,
        cooldown: 2,
        targets: ["windowFixation", "verification"]
    },
    persistent: {
        family: "observer",
        intensity: 4,
        cost: 10,
        base: .34,
        cooldown: 3,
        targets: ["windowFixation", "approach"]
    },
    observer_shift: {
        family: "observer",
        intensity: 5,
        cost: 11,
        base: .31,
        cooldown: 3,
        targets: ["verification", "windowFixation"]
    },
    observer_vanish: {
        family: "observer",
        intensity: 3,
        cost: 5,
        base: .44,
        cooldown: 2,
        targets: ["verification", "windowFixation"]
    },
    observer_closer: {
        family: "observer",
        intensity: 4,
        cost: 8,
        base: .36,
        cooldown: 3,
        targets: ["verification", "windowFixation"]
    },
    observer_behind: {
        family: "observer",
        intensity: 5,
        cost: 11,
        base: .30,
        cooldown: 3,
        targets: ["lookBack", "windowFixation"]
    },
    prop_rotate: {
        family: "environment",
        intensity: 2,
        cost: 3,
        base: .47,
        cooldown: 1,
        targets: ["verification", "approach"]
    },
    prop: {
        family: "environment",
        intensity: 3,
        cost: 4,
        base: .43,
        cooldown: 1,
        targets: ["verification", "approach"]
    },
    cabinet_open: {
        family: "environment",
        intensity: 3,
        cost: 5,
        base: .39,
        cooldown: 2,
        targets: ["verification", "approach"]
    },
    door_relock: {
        family: "environment",
        intensity: 3,
        cost: 4,
        base: .37,
        cooldown: 2,
        targets: ["exitUrgency", "flee"]
    },
    occupancy: {
        family: "system",
        intensity: 4,
        cost: 6,
        base: .35,
        cooldown: 3,
        targets: ["verification", "freeze"]
    },
    previous_room_mutation: {
        family: "environment",
        intensity: 4,
        cost: 8,
        base: .66,
        cooldown: 3,
        targets: ["verification", "windowFixation"]
    },
    huntprep: {
        family: "threat",
        intensity: 5,
        cost: 25,
        base: 1,
        cooldown: 99,
        targets: ["flee"]
    },
    report: {
        family: "system",
        intensity: 2,
        cost: 4,
        base: 1,
        cooldown: 0,
        targets: []
    }
};

function HorrorNormV012(e) {
    return Math.min(1, Math.max(0, (Number(e) || 0) / 3))
}

function HorrorTargetV012(e) {
    return ["window", "false_observer", "persistent", "observer_shift", "observer_vanish", "observer_closer", "observer_behind", "blackout_observer"].includes(e) ? "observation-window" : ["camera", "camera_reposition", "camera_led"].includes(e) ? "camera" : e === "door_relock" ? "door" : null
}

function Me(a, e, t, i = "OBSERVED", f = null) {
    const s = new B(`${i}|horror-director-v012|${e}|${t}`),
        o = [0, 2, 5, 8, 10, 16, 3, 12, 8, 5, 16, 10, 30, 6][e] ?? 6,
        n = [];
    const r = (at, candidates, duration = .8, trigger = "time", bias = .12, forced = !1) => n.push({
        at,
        duration,
        trigger,
        bias,
        forced,
        done: !1,
        roll: s.next(),
        candidates: candidates.map(type => ({
            type,
            roll: s.next()
        }))
    });
    const side = s.next() < .5 ? -1 : 1,
        c = side * (a.size.width / 2 - .42),
        u = s.int(-18, 18) / 10;
    switch (e) {
        case 1:
            r(s.int(2, 4), ["impact", "camera_led"], .18, "time", .7, !0);
            break;
        case 2:
            r(s.int(6, 9), ["impact"], .16, "time", .7, !0), r(s.int(14, 17), ["step"], .22, "time", .65, !0);
            break;
        case 3:
            r(s.int(4, 6), ["lightdip"], .55, "time", .7, !0), r(s.int(8, 11), ["window", "false_observer"], s.int(12, 17) / 10, "time", .7, !0);
            break;
        case 4:
            r(s.int(3, 5), ["camera_led"], .32, "time", .7, !0), r(s.int(9, 13), ["window", "false_observer"], s.int(13, 19) / 10, "time", .72, !0);
            break;
        case 5:
            r(s.int(3, 5), ["stutter", "fixture_off"], .7, "time", .72, !0), r(s.int(9, 12), ["blackout_observer"], s.int(12, 17) / 10, "time", .86, !0);
            break;
        case 6:
            r(s.int(16, 24), ["silence"], s.int(22, 34) / 10, "time", -.16);
            break;
        case 7:
            r(s.int(12, 19), ["observer_shift", "camera", "camera_reposition", "extra_step", "mimic_steps", "prop_rotate", "cabinet_open"], s.int(14, 23) / 10, "time", .12);
            break;
        case 8:
            r(s.int(13, 21), ["prop", "prop_rotate", "cabinet_open", "silence"], 1.1, "time", -.01);
            break;
        case 9:
            r(s.int(14, 22), ["lightdip", "camera_led", "fixture_off", "sector_failure"], .65, "time", -.04);
            break;
        case 10:
            r(5, ["blackout_observer"], 2.1, "provoked", .8, !0);
            break;
        case 11:
            r(s.int(13, 20), ["occupancy", "camera_reposition", "speaker_click"], 1.8, "time", -.04);
            break;
        case 12:
            r(s.int(9, 15), ["silence", "camera_led", "extra_step"], 1.2, "time", -.12), r(5, ["huntprep"], 1, "provoked", 1, !0);
            break;
        case 13:
            r(15, ["report"], 10, "time", .5, !0);
            break;
    }
    const due = f?.pendingCallbacks?.some(x => !x.shown && x.dueRoom <= e);
    if (due && ![1, 2, 3, 6, 12, 13].includes(e) && o >= 3) r(s.int(8, 14), ["system_callback"], 2.4, "time", .3, !0);
    if (e >= 4 && e <= 11 && ![6, 10].includes(e) && s.next() < .28 && o >= 3) r(s.int(27, 39), ["lightdip", "impact", "camera_led", "speaker_click"], .3, "time", -.08);
    const inherited = f?.globalTension ?? 0;
    return {
        version: 5,
        phase: "baseline",
        phaseTime: 0,
        phaseDuration: 0,
        age: 0,
        roomIndex: e,
        x: c,
        z: u,
        targetX: 0,
        targetZ: a.door.z + 1.1,
        memory: 0,
        style: t,
        tension: Math.max(0, Math.min(34, inherited * .32 + (e >= 7 ? 7 : 0))),
        targetTension: 0,
        recentPeak: Math.max(0, (f?.recentPeak ?? 0) * .28),
        recoveryUntil: 0,
        budget: o,
        spent: 0,
        eventCount: 0,
        lastEventAt: -999,
        lastDecision: "INIT",
        rejected: [],
        history: [],
        cameraYaw: 0,
        cameraStartYaw: 0,
        cameraTargetYaw: 0,
        directorSeed: `${i}|${e}|${t}`,
        opportunitySeq: 0,
        lastDynamicAt: -999,
        kindLastAt: {},
        huntCommitted: !1,
        room10BeatCommitted: !1,
        room11MutationCommitted: !1,
        windowObserver: {
            visible: !1,
            persistent: !1,
            z: u,
            depth: 1.45,
            scale: 1,
            kind: "none",
            lookBehind: !1,
            lookBehindX: null,
            lookBehindZ: null
        },
        plan: {
            cueX: c,
            cueZ: u,
            speed: 2.78,
            schedule: n
        }
    }
}

function mi(a, e) {
    if (!a || a.version !== 5 || !a.plan || !Array.isArray(a.plan.schedule) || typeof a.style !== "string" || ![a.age, a.phaseTime, a.phaseDuration, a.x, a.z, a.targetX, a.targetZ, a.memory, a.tension, a.targetTension, a.recentPeak, a.recoveryUntil, a.budget, a.spent, a.lastEventAt, a.cameraYaw, a.opportunitySeq, a.lastDynamicAt, a.plan.cueX, a.plan.cueZ, a.plan.speed].every(Number.isFinite) || a.age < 0 || a.phaseTime < 0 || a.memory < 0 || a.budget < 0 || a.spent < 0 || a.spent > a.budget + 25 || a.plan.speed < 2 || a.plan.speed > 3.2 || Math.abs(a.x) > e.size.width / 2 || Math.abs(a.z) > e.size.depth / 2 || !Array.isArray(a.history) || !Array.isArray(a.rejected) || !a.windowObserver || typeof a.windowObserver.visible !== "boolean" || a.plan.schedule.some(t => !t || typeof t.trigger !== "string" || typeof t.done !== "boolean" || ![t.at, t.duration, t.bias, t.roll].every(Number.isFinite) || !Array.isArray(t.candidates) || t.candidates.some(i => !i || typeof i.type !== "string" || !Number.isFinite(i.roll) || !HorrorLibraryV012[i.type]))) throw new Error("Invalid horror director state")
}
class gi {
    constructor(e, t) {
        this.state = e, this.room = t
    }
    state;
    room;
    route = [];
    repath = 0;
    phase(e, t = 0) {
        this.state.phase = e, this.state.phaseTime = 0, this.state.phaseDuration = t, this.route = [], this.repath = 0
    }
    placeForHunt(e, t) {
        const i = this.room.size.width / 2 - .55,
            s = this.room.size.depth / 2 - .75,
            n = [{
                x: e.x >= 0 ? -i : i,
                z: -s
            }, {
                x: e.x >= 0 ? -i : i,
                z: s
            }, {
                x: e.x < 0 ? -i : i,
                z: -s
            }, {
                x: 0,
                z: this.room.door.z + 1.05
            }].filter(r => !t.blocked(r.x, r.z, .24)).sort((r, c) => Math.hypot(e.x - c.x, e.z - c.z) - Math.hypot(e.x - r.x, e.z - r.z))[0];
        n && (this.state.x = n.x, this.state.z = n.z, this.state.targetX = n.x, this.state.targetZ = n.z)
    }
    candidateScore(e, t, i) {
        const s = HorrorLibraryV012[e.type],
            o = t.fear ?? {},
            n = o.lastFamilyRoom?.[s.family] ?? -999,
            r = o.lastTypeRoom?.[e.type] ?? -999,
            c = (this.state.roomIndex - n) < s.cooldown,
            u = this.state.roomIndex - r < Math.max(1, s.cooldown),
            d = (o.lastMajorRoom ?? -999) >= this.state.roomIndex - 1 && s.intensity >= 4,
            l = this.state.age < this.state.recoveryUntil && s.intensity >= 3,
            x = i.kind === "RECHECK" && ["observer", "window", "surveillance"].includes(s.family);
        if ((c || u || d || l) && !i.forced && !x) return {
            score: -99,
            reason: c ? "family_cooldown" : u ? "type_cooldown" : d ? "major_recovery" : "recovery_window"
        };
        let y = s.base + i.bias + (e.roll - .5) * .18;
        for (const m of s.targets) {
            const g = o.confidence?.[m] ?? HorrorNormV012(o[m]);
            g >= .5 && (y += g * .17)
        }
        const g = {
            checker: ["verification"],
            runner: ["flee", "exitUrgency"],
            surveillance: ["cameraFixation"],
            compliant: ["freeze"],
            contrarian: ["verification"],
            curiosity: ["approach", "soundInvestigation"],
            reward: ["approach"]
        } [this.state.style] ?? [];
        g.some(m => s.targets.includes(m)) && (y += .12);
        if (i.kind === "RECHECK" && s.targets.includes("verification")) y += .18;
        if (i.kind === "LONG_STILLNESS" && ["audio", "window"].includes(s.family)) y += .08;
        if (i.kind === "EXIT_APPROACH" && ["environment", "system"].includes(s.family)) y += .11;
        this.state.tension > 66 && s.intensity >= 4 && (y -= .25), this.state.tension > 80 && s.intensity >= 3 && (y -= .3);
        const continuationCost = e.type === "system_callback" && this.state.roomIndex === 11 ? 2 : x ? Math.min(3, s.cost) : s.cost,
            reserve = this.state.roomIndex === 10 && !this.state.room10BeatCommitted && e.type !== "blackout_observer" ? 10 : this.state.roomIndex === 11 && !this.state.room11MutationCommitted && e.type !== "previous_room_mutation" ? 8 : this.state.roomIndex === 12 && !this.state.huntCommitted && e.type !== "huntprep" ? 25 : 0,
            E = this.state.spent + continuationCost > this.state.budget - reserve;
        if (E) return {
            score: -99,
            reason: "budget"
        };
        return {
            score: y,
            reason: "eligible",
            cost: continuationCost
        }
    }
    chooseOpportunity(e, t) {
        const i = [],
            s = [];
        for (const o of e.candidates) {
            const n = this.candidateScore(o, t, e);
            n.score > -90 ? i.push({
                type: o.type,
                score: n.score,
                cost: n.cost
            }) : s.push({
                type: o.type,
                reason: n.reason
            })
        }
        const o = .69 + Math.min(.27, this.state.tension / 180) + (this.state.age < this.state.recoveryUntil ? .25 : 0) + (e.roll - .5) * .13 - e.bias * .3;
        if (i.length === 0 || !e.forced && o >= Math.max(...i.map(r => r.score))) return this.state.rejected = s, this.state.lastDecision = `NO_EVENT ${e.kind??e.trigger} ${o.toFixed(2)}`, this.state.history.push({
            age: +this.state.age.toFixed(2),
            kind: e.kind ?? e.trigger,
            decision: "NO_EVENT",
            score: +o.toFixed(2)
        }), this.state.tension = Math.max(0, this.state.tension - 3.5), {
            type: "no_event",
            duration: 0
        };
        const n = i.sort((r, c) => c.score - r.score)[0],
            r = HorrorLibraryV012[n.type];
        return this.state.rejected = s, this.state.lastDecision = `${n.type} ${n.score.toFixed(2)}`, this.state.spent += n.cost, this.state.eventCount++, this.state.lastEventAt = this.state.age, this.state.tension = Math.min(100, this.state.tension + r.intensity * 7), this.state.recentPeak = Math.max(this.state.recentPeak, this.state.tension), r.intensity >= 4 && (this.state.recoveryUntil = this.state.age + 48), this.state.history.push({
            age: +this.state.age.toFixed(2),
            kind: e.kind ?? e.trigger,
            decision: n.type,
            score: +n.score.toFixed(2),
            tension: +this.state.tension.toFixed(1),
            cost: n.cost
        }), this.state.history.length > 32 && this.state.history.shift(), {
            type: n.type,
            duration: e.duration
        }
    }
    startEvent(e, t, i) {
        const s = this.state,
            o = s.windowObserver;
        if (e === "window") Object.assign(o, {
            visible: !0,
            persistent: !1,
            kind: "observer",
            depth: 1.45,
            scale: .9,
            lookBehind: !1
        });
        if (e === "false_observer") Object.assign(o, {
            visible: !0,
            persistent: !1,
            kind: "false",
            depth: 1.45,
            scale: 1,
            lookBehind: !1
        });
        if (e === "persistent") Object.assign(o, {
            visible: !0,
            persistent: !0,
            kind: "observer",
            depth: 1.1,
            scale: 1,
            lookBehind: !1
        });
        if (e === "blackout_observer") Object.assign(o, {
            visible: !0,
            persistent: !0,
            kind: "observer",
            depth: 1.05,
            scale: 1,
            lookBehind: !1
        });
        if (e === "observer_shift") Object.assign(o, {
            visible: !0,
            persistent: !0,
            kind: "observer",
            z: Math.max(-this.room.size.depth / 2 + 1.1, Math.min(this.room.size.depth / 2 - 1.1, o.z + (s.opportunitySeq % 2 ? 1.15 : -1.15))),
            lookBehind: !1
        });
        if (e === "observer_closer") Object.assign(o, {
            visible: !0,
            persistent: !0,
            kind: "observer",
            depth: Math.max(.42, (o.depth ?? 1.45) - .55),
            scale: 1,
            lookBehind: !1
        });
        if (e === "observer_vanish") Object.assign(o, {
            visible: !1,
            persistent: !1,
            kind: "none",
            lookBehind: !1
        });
        if (e === "observer_behind") Object.assign(o, {
            visible: !0,
            persistent: !0,
            kind: "observer",
            depth: o.depth ?? 1.05,
            scale: 1,
            lookBehind: !0,
            lookBehindX: i.x + Math.sin(i.yaw ?? 0) * 2.2,
            lookBehindZ: i.z + Math.cos(i.yaw ?? 0) * 2.2
        });
        if (e === "camera") {
            const n = this.room.size.width / 2 - .5,
                r = -this.room.size.depth / 2 + .8;
            s.cameraStartYaw = s.cameraYaw, s.cameraTargetYaw = Math.atan2(i.x - n, i.z - r)
        } else if (e === "camera_reposition") s.cameraStartYaw = s.cameraYaw, s.cameraTargetYaw = s.cameraYaw + (s.opportunitySeq % 2 ? -1 : 1) * (.58 + (s.opportunitySeq % 4) * .08);
        e === "blackout_observer" && (s.room10BeatCommitted = !0), e === "previous_room_mutation" && (s.room11MutationCommitted = !0);
        if (e === "huntprep") {
            s.huntCommitted = !0, this.phase("hunt_blackout", .95)
        } else this.phase(e, ["camera", "camera_reposition"].includes(e) ? Math.max(.8, Math.min(1.4, t)) : t)
    }
    dynamicOpportunity(e, t, i) {
        const s = this.state,
            o = {
                RECHECK: 3.2,
                LONG_STILLNESS: 14,
                RETURN: 9,
                EXIT_APPROACH: 12,
                POST_BLACKOUT: 4
            } [e] ?? 8;
        if (s.age - (s.kindLastAt[e] ?? -999) < o) return null;
        s.kindLastAt[e] = s.age, s.opportunitySeq++;
        const n = new B(`${s.directorSeed}|dynamic|${e}|${s.opportunitySeq}`);
        let r = [],
            c = .03,
            u = !1;
        if (s.roomIndex === 4) {
            if (e === "RECHECK") r = ["window", "false_observer", "camera_led"];
            else if (e === "LONG_STILLNESS") r = ["window", "camera_led"];
            else if (e === "RETURN") r = ["false_observer", "camera_led"];
            else if (e === "EXIT_APPROACH") r = ["camera_led", "window"];
            else return null;
            c = -.08
        } else if (s.roomIndex === 6) {
            if (e !== "LONG_STILLNESS") return null;
            r = ["silence"], c = -.18
        } else if (s.roomIndex === 9) {
            if (e === "LONG_STILLNESS" || e === "EXIT_APPROACH") r = ["impact", "lightdip"];
            else if (e === "RECHECK" || e === "RETURN" || e === "POST_BLACKOUT") r = ["camera_led", "lightdip"];
            else return null;
            c = -.1
        } else if (s.roomIndex === 11) {
            if (e === "RECHECK" && (i?.target ?? t.fear?.recheckTarget) === "observation-window" && t.fear?.hasPreviousRoom) r = ["previous_room_mutation"], c = .2, u = !0;
            else if (e === "RECHECK") r = ["camera_reposition"];
            else if (e === "LONG_STILLNESS") r = ["silence", "speaker_click"];
            else if (e === "RETURN") r = ["camera_reposition", "occupancy"];
            else if (e === "EXIT_APPROACH") r = ["speaker_click", "false_system"];
            else if (e === "POST_BLACKOUT") r = ["prop_rotate", "camera_reposition"];
            else return null
        } else if (e === "RECHECK") {
            const d = i?.target ?? t.fear?.recheckTarget;
            if (d === "camera") r = ["camera_reposition", "camera_led"];
            else if (s.roomIndex === 11 && t.fear?.hasPreviousRoom) r = ["previous_room_mutation"];
            else if (s.windowObserver.visible) r = ["persistent", "observer_shift", "observer_vanish", "observer_closer", "observer_behind"];
            else r = ["window", "false_observer", "camera_led"];
            c = .2, u = s.roomIndex === 11 && t.fear?.hasPreviousRoom
        } else if (e === "LONG_STILLNESS") r = s.roomIndex >= 5 ? ["silence", "step", "speaker_click", "window"] : ["impact", "speaker_click"];
        else if (e === "RETURN") r = s.roomIndex === 11 && t.fear?.hasPreviousRoom ? ["camera_reposition", "occupancy"] : ["prop", "prop_rotate", "camera_reposition", "occupancy"];
        else if (e === "EXIT_APPROACH") r = s.roomIndex >= 7 ? ["door_relock", "speaker_click", "false_system"] : ["speaker_click", "lightdip"];
        else if (e === "POST_BLACKOUT") r = s.windowObserver.visible ? ["observer_shift", "observer_vanish", "prop_rotate"] : ["prop_rotate", "camera_reposition", "window"];
        if (!r.length) return null;
        const d = {
                at: s.age,
                duration: e === "RECHECK" ? 1.1 : e === "LONG_STILLNESS" ? 1.5 : e === "RETURN" ? 1.2 : .9,
                trigger: "behavior",
                kind: e,
                bias: c,
                forced: u,
                done: !0,
                roll: n.next(),
                candidates: r.map(type => ({
                    type,
                    roll: n.next()
                }))
            },
            l = this.chooseOpportunity(d, t);
        if (l.type === "no_event") return {
            previous: s.phase,
            phase: s.phase,
            detected: !1,
            event: "no_event"
        };
        const y = s.phase;
        return this.startEvent(l.type, l.duration, t), {
            previous: y,
            phase: s.phase,
            detected: !1,
            event: l.type
        }
    }
    update(e, t, i) {
        if (!Number.isFinite(e) || e < 0 || e > .11) throw new Error("Invalid horror delta");
        const s = this.state,
            o = s.phase;
        s.age += e, s.phaseTime += e;
        s.tension = Math.max(0, s.tension - e * (s.age < s.recoveryUntil ? .95 : .3)), s.recentPeak = Math.max(s.tension, s.recentPeak - e * .06), s.targetTension = s.tension, t.fear?.reactionPulse && (s.tension = Math.min(100, s.tension + t.fear.reactionPulse * 2), s.recentPeak = Math.max(s.recentPeak, s.tension));
        if (s.phase === "caught" || s.phase === "gone") return {
            previous: o,
            phase: s.phase,
            detected: !1,
            event: null
        };
        if (t.z < this.room.door.z - .25) {
            if (["hunt", "search", "hunt_blackout", "hunt_reveal"].includes(s.phase)) this.phase("gone");
            return {
                previous: o,
                phase: s.phase,
                detected: !1,
                event: null
            }
        }
        if (s.phase === "hunt_blackout" && s.phaseTime >= s.phaseDuration) {
            this.placeForHunt(t, i), this.phase("hunt_reveal", 1.45);
            return {
                previous: o,
                phase: s.phase,
                detected: !1,
                event: "hunt_reveal"
            }
        }
        if (s.phase === "hunt_reveal" && s.phaseTime >= s.phaseDuration) {
            this.phase("hunt");
            return {
                previous: o,
                phase: s.phase,
                detected: !1,
                event: "hunt"
            }
        }
        if (!["baseline", "hunt", "search"].includes(s.phase)) {
            if (s.phaseTime >= s.phaseDuration) {
                const n = s.phase;
                ["camera", "camera_reposition"].includes(n) && (s.cameraYaw = s.cameraTargetYaw ?? s.cameraYaw);
                if (["window", "false_observer"].includes(n) && !s.windowObserver.persistent) Object.assign(s.windowObserver, {
                    visible: !1,
                    kind: "none",
                    lookBehind: !1
                });
                if (n === "blackout_observer") Object.assign(s.windowObserver, {
                    visible: !0,
                    persistent: !0,
                    kind: "observer"
                });
                this.phase("baseline");
                return {
                    previous: n,
                    phase: s.phase,
                    detected: !1,
                    event: ["blackout", "blackout_prop", "blackout_observer"].includes(n) ? "post_blackout" : "end"
                }
            }
            return {
                previous: o,
                phase: s.phase,
                detected: !1,
                event: null
            }
        }
        if (s.phase === "baseline") {
            const n = t.fear?.opportunities ?? [];
            if (n.length) {
                const r = n[0],
                    c = this.dynamicOpportunity(r.kind, t, r);
                if (c) return c
            }
            for (const n of s.plan.schedule) {
                if (n.done) continue;
                const r = n.trigger === "time" ? s.age >= n.at : n.trigger === "provoked" ? t.provoked && s.age >= n.at : !1;
                if (!r) continue;
                n.done = !0;
                const c = this.chooseOpportunity(n, t);
                if (c.type === "no_event") return {
                    previous: o,
                    phase: s.phase,
                    detected: !1,
                    event: "no_event"
                };
                const u = s.phase;
                return this.startEvent(c.type, c.duration, t), {
                    previous: u,
                    phase: s.phase,
                    detected: !1,
                    event: c.type
                }
            }
            return {
                previous: o,
                phase: s.phase,
                detected: !1,
                event: null
            }
        }
        const n = Math.hypot(t.x - s.x, t.z - s.z),
            r = i.occlusion(s, t) === 0,
            c = r && n < (t.crouching && !t.flashlight ? 2.8 : 6.2),
            u = t.interacted && n < 7.5 || t.moving && t.running && n < (r ? 9.5 : 5.5),
            d = c || u;
        if (d ? (s.targetX = Math.max(-this.room.size.width / 2 + .3, Math.min(this.room.size.width / 2 - .3, t.x)), s.targetZ = Math.max(-this.room.size.depth / 2 + .3, Math.min(this.room.size.depth / 2 - .3, t.z)), s.memory = 3.6, s.phase === "search" && this.phase("hunt")) : (s.memory = Math.max(0, s.memory - e), s.memory === 0 && s.phase === "hunt" && this.phase("search")), d && r && n < .55 && s.phaseTime > .9) return this.phase("caught"), {
            previous: o,
            phase: s.phase,
            detected: d,
            event: "caught"
        };
        if (s.phase === "search" && s.phaseTime > 7) return this.phase("gone"), {
            previous: o,
            phase: s.phase,
            detected: d,
            event: "gone"
        };
        this.repath -= e, this.repath <= 0 && (this.route = this.findPath(i, {
            x: s.targetX,
            z: s.targetZ
        }), this.repath = .55);
        const l = this.route[0];
        if (l) {
            const y = l.x - s.x,
                m = l.z - s.z,
                g = Math.hypot(y, m);
            if (g < .12) this.route.shift();
            else {
                const E = s.phase === "hunt" ? s.plan.speed : .9,
                    P = i.move(s.x, s.z, y / g * Math.min(g, E * e), m / g * Math.min(g, E * e), .22);
                s.x = P.x, s.z = P.z
            }
        }
        return {
            previous: o,
            phase: s.phase,
            detected: d,
            event: null
        }
    }
    findPath(e, t) {
        const s = this.room.size.width,
            o = this.room.size.depth,
            n = Math.ceil(s / .4),
            r = Math.ceil(o / .4),
            c = (g, E) => Math.min(r - 1, Math.max(0, Math.floor((E + o / 2) / .4))) * n + Math.min(n - 1, Math.max(0, Math.floor((g + s / 2) / .4))),
            u = c(this.state.x, this.state.z),
            d = c(t.x, t.z),
            l = [u],
            y = new Map([
                [u, -1]
            ]),
            m = g => ({
                x: -s / 2 + (g % n + .5) * .4,
                z: -o / 2 + (Math.floor(g / n) + .5) * .4
            });
        for (let g = 0; g < l.length; g++) {
            const E = l[g];
            if (E === d) {
                const k = [];
                for (let I = d; I !== u; I = y.get(I)) k.push(m(I));
                return k.reverse()
            }
            const P = E % n,
                S = Math.floor(E / n);
            for (const [k, I] of [
                    [P - 1, S],
                    [P + 1, S],
                    [P, S - 1],
                    [P, S + 1]
                ]) {
                if (k < 0 || k >= n || I < 0 || I >= r) continue;
                const L = I * n + k,
                    V = m(L);
                y.has(L) || Math.abs(V.x) > s / 2 - .25 || Math.abs(V.z) > o / 2 - .25 || e.blocked(V.x, V.z, .23) || (y.set(L, E), l.push(L))
            }
        }
        return []
    }
}
class st {
    threat;
    deaths = 0;
    campaign;
    model;
    runtime;
    bus = new Kt;
    time = 0;
    sequence = 0;
    inspected = new Set;
    zones = new Set;
    predictionId = null;
    fear = {
        version: 3,
        verification: 0,
        tripleCheck: 0,
        lookBack: 0,
        freeze: 0,
        flee: 0,
        approach: 0,
        avoidance: 0,
        soundInvestigation: 0,
        darknessTolerance: 0,
        flashlightDependence: 0,
        exitUrgency: 0,
        cameraFixation: 0,
        windowFixation: 0,
        lastLookTarget: "",
        lastLookTime: -999,
        lastAnomaly: -999,
        lastType: "",
        lastAnomalyTarget: null,
        anomalyPerceived: !1,
        recheckArmedTarget: null,
        recheckArmedType: null,
        recheckArmedAt: -999,
        recheckTarget: null,
        recheckType: null,
        recheckPulse: !1,
        recheckTimes: [],
        reactionPulse: 0,
        globalTension: 0,
        recentPeak: 0,
        anomalyYaw: 0,
        anomalyPlayerX: 0,
        anomalyPlayerZ: 0,
        anomalySourceX: 0,
        anomalySourceZ: 0,
        flashlightAtAnomaly: !1,
        perceptionTarget: "",
        perceptionDwell: 0,
        perceptionYaw: 0,
        lookAwayCandidateTarget: null,
        lookAwayCandidateType: null,
        lookAwayCandidateYaw: 0,
        lookAwayCandidateAt: -999,
        responseRecorded: !0,
        freezeTime: 0,
        fleeCandidateActive: !1,
        fleeCandidateSince: -999,
        fleeCandidateDistance: 0,
        fleeLastDistance: 0,
        lookBackRecorded: !0,
        darknessRecorded: !0,
        darknessExposure: 0,
        darknessEpisodeActive: !1,
        darknessStartedWithFlashlight: !1,
        positionRecorded: !0,
        exitRecorded: !0,
        stillnessTime: 0,
        lastStillnessAt: -999,
        lastZone: "",
        zoneVisits: {},
        lastReturnAt: -999,
        exitApproachRoom: -999,
        opportunityQueue: [],
        pendingCallbacks: [],
        callbackKeys: {},
        activeSystemText: "",
        previousSystemText: "",
        reportComplete: !1,
        predictionOutcome: null,
        predictionHistory: [],
        modelBreaks: 0,
        modelConfirmations: 0,
        routeHistory: {},
        currentRoute: [],
        routeSampleAt: -999,
        previousRoomSnapshot: null,
        lastRoomPlayer: null,
        lastFamilyRoom: {},
        lastTypeRoom: {},
        lastMajorRoom: -999
    };
    constructor(e, t) {
        if (this.campaign = new fi(e, t?.campaign), this.model = t ? be.restore(t.behavior) : new be, this.runtime = new we(this.campaign.experiment(), t?.experiment), this.threat = t?.threat?.version === 5 ? structuredClone(t.threat) : Me(this.campaign.room(), this.campaign.state.index, new ie().fearStrategy(this.model.snapshot()), e, t?.fear), mi(this.threat, this.campaign.room()), t) {
            if (!Number.isSafeInteger(t.deaths) || t.deaths < 0) throw new Error("Invalid death count");
            this.deaths = t.deaths
        }
        if (this.bus.subscribe(i => this.model.ingest(i)), t) {
            if (this.runtime.state.power?.floor && !qe(this.campaign.room(), this.runtime.state.power.floor)) throw new Error("Unreachable saved fuse");
            const i = new Set(this.campaign.room().props.map(s => s.id));
            for (const s of Object.keys(this.runtime.state.flags))
                for (const o of ["cabinet-open:", "cabinet-visited:", "document-read:"])
                    if (s.startsWith(o) && !i.has(s.slice(o.length))) throw new Error("Invalid saved cabinet identity");
            if (!Number.isFinite(t.time) || t.time < t.behavior.lastTime || !Number.isInteger(t.sequence) || t.sequence < 0 || !Array.isArray(t.inspected) || t.inspected.length > 256 || !Array.isArray(t.zones) || t.zones.length > 1024 || t.behavior.currentRoom !== this.roomId || t.behavior.room !== this.campaign.state.index || t.predictionId !== null && !Object.hasOwn(t.behavior.pending, t.predictionId)) throw new Error("Invalid session state");
            this.time = t.time, this.sequence = t.sequence, this.inspected = new Set(t.inspected), this.zones = new Set(t.zones), this.predictionId = t.predictionId, t.fear && [1, 2, 3].includes(t.fear.version) && (this.fear = {
                ...this.fear,
                ...structuredClone(t.fear),
                version: 3,
                lastFamilyRoom: {
                    ...this.fear.lastFamilyRoom,
                    ...t.fear.lastFamilyRoom
                },
                lastTypeRoom: {
                    ...this.fear.lastTypeRoom,
                    ...t.fear.lastTypeRoom
                },
                zoneVisits: {
                    ...this.fear.zoneVisits,
                    ...t.fear.zoneVisits
                },
                callbackKeys: {
                    ...this.fear.callbackKeys,
                    ...t.fear.callbackKeys
                },
                opportunityQueue: [],
                recheckPulse: !1,
                reactionPulse: 0
            })
        } else this.enterRoom();
        this.threat.cameraStartYaw ??= this.threat.cameraYaw, this.threat.cameraTargetYaw ??= this.threat.cameraYaw, this.threat.windowObserver.depth ??= 1.45, this.threat.windowObserver.lookBehindX ??= null, this.threat.windowObserver.lookBehindZ ??= null, this.threat.room10BeatCommitted ??= this.threat.roomIndex === 10 && this.threat.history.some(i => i.decision === "blackout_observer"), this.threat.room11MutationCommitted ??= this.threat.roomIndex === 11 && this.threat.history.some(i => i.decision === "previous_room_mutation")
    }
    get roomId() {
        return `TEST-${this.campaign.state.index}`
    }
    usePower(e, t) {
        if (e === "drop-fuse" && (!t || !qe(this.campaign.room(), t))) {
            this.runtime.state.notice = "Здесь нельзя положить предмет. Отойдите от стены или оборудования.";
            return
        }
        this.runtime.powerAction(e, t).forEach(i => this.observe(i))
    }
    toggleCabinet(e) {
        if (!this.campaign.room().props.some(s => s.id === e)) return !1;
        const t = ke(e),
            i = !this.runtime.state.flags[t];
        return this.runtime.state.flags[t] = i, i && (this.runtime.state.flags[`cabinet-visited:${e}`] = !0), this.observe({
            type: "INTERACTED",
            context: "unknownObjects",
            target: e,
            data: {
                opened: i
            }
        }), i
    }
    readDocument(e) {
        if (!this.runtime.state.flags[ke(e)] || !this.campaign.room().props.some(s => s.id === e)) return null;
        const t = ii(`${this.campaign.state.seed}|${this.roomId}`, e),
            i = si(e);
        return this.runtime.state.flags[i] || (this.runtime.state.flags[i] = !0, this.observe({
            type: "CHOSE_OPTION",
            context: "documents",
            target: t.id,
            data: {
                inspectedDocument: !0,
                choice: "OPEN_DOCUMENT"
            }
        })), t
    }
    locateSource(e) {
        const t = this.runtime.definition.soundVariant;
        if (!t || this.runtime.state.flags.sourceFound) return;
        const i = Ae(this.campaign.room(), this.campaign.state.index).findIndex(s => s.id === e);
        i < 0 || (this.interact(e, "sound", i === t.sourceIndex ? "source" : "wrong-source"), i === t.sourceIndex && this.resolve("EXPLORE"))
    }
    observe(e) {
        this.bus.emit({
            ...e,
            id: `e-${++this.sequence}`,
            roomId: this.roomId,
            time: this.time
        })
    }
    enterRoom() {
        this.inspected.clear(), this.zones.clear(), Object.assign(this.fear, {
            lastLookTarget: "",
            lastLookTime: -999,
            lastAnomaly: -999,
            lastType: "",
            lastAnomalyTarget: null,
            anomalyPerceived: !1,
            recheckArmedTarget: null,
            recheckArmedType: null,
            recheckArmedAt: -999,
            recheckTarget: null,
            recheckType: null,
            recheckPulse: !1,
            recheckTimes: [],
            perceptionTarget: "",
            perceptionDwell: 0,
            perceptionYaw: 0,
            lookAwayCandidateTarget: null,
            lookAwayCandidateType: null,
            lookAwayCandidateYaw: 0,
            lookAwayCandidateAt: -999,
            responseRecorded: !0,
            freezeTime: 0,
            fleeCandidateActive: !1,
            fleeCandidateSince: -999,
            fleeCandidateDistance: 0,
            fleeLastDistance: 0,
            lookBackRecorded: !0,
            darknessRecorded: !0,
            darknessExposure: 0,
            darknessEpisodeActive: !1,
            darknessStartedWithFlashlight: !1,
            positionRecorded: !0,
            exitRecorded: !0,
            stillnessTime: 0,
            lastStillnessAt: -999,
            lastZone: "",
            zoneVisits: {},
            lastReturnAt: -999,
            exitApproachRoom: -999,
            opportunityQueue: [],
            lastRoomPlayer: null,
            currentRoute: [],
            routeSampleAt: -999,
            reportComplete: this.campaign.state.index === 13 ? !1 : this.fear.reportComplete
        }), this.observe({
            type: "PLAYER_ENTERED_ROOM",
            context: "navigation"
        }), this.predictionId = this.model.predict({
            context: this.runtime.definition.button ? "buttons" : "doors",
            instruction: ["prohibition", "repeat-inhibition", "wait"].includes(this.campaign.kind) ? "do-not" : "do"
        }, !0).id ?? null
    }
    predictionBrief() {
        const e = this.campaign.state.decision;
        if (!e) return null;
        const t = {
            Persistence: "REPEAT THE PREVIOUS METHOD",
            Adaptability: "CHANGE THE METHOD AFTER FAILURE",
            Curiosity: "SEARCH BEYOND THE OBVIOUS SOURCE",
            "Meta Suspicion": "QUESTION THE SYSTEM'S STATEMENT",
            Greed: "TAKE THE OPTIONAL REWARD",
            "Rule Breaking": "BREAK THE EXPLICIT PROHIBITION",
            "Surveillance Awareness": "LOOK DIRECTLY AT THE OBSERVER",
            Patience: "WAIT THROUGH THE RESPONSE WINDOW",
            Caution: "DELAY YOUR FIRST ACTION"
        } [e.trait] ?? "FOLLOW THE PREDICTED PROCEDURE";
        return {
            trait: e.trait ?? "CALIBRATION",
            expected: t,
            goal: e.goal ?? "COLLECT ANOTHER OBSERVATION",
            confidence: Number.isFinite(e.confidence) ? e.confidence : 0,
            tentative: !!e.tentative,
            counter: !!e.counter
        }
    }
    recordRoute(e, t, i) {
        if (this.time - this.fear.routeSampleAt < .32) return;
        const s = this.campaign.room().size,
            o = {
                x: Math.max(-1, Math.min(1, e / Math.max(1, s.width / 2 - .4))),
                z: Math.max(-1, Math.min(1, t / Math.max(1, s.depth / 2 - .4))),
                yaw: i,
                at: this.runtime.state.elapsed
            },
            n = this.fear.currentRoute.at(-1),
            r = n ? Math.abs(Math.atan2(Math.sin(i - n.yaw), Math.cos(i - n.yaw))) : 9;
        n && Math.hypot(o.x - n.x, o.z - n.z) < .035 && r < .28 || (this.fear.currentRoute.push(o), this.fear.currentRoute.length > 160 && this.fear.currentRoute.shift()), this.fear.routeSampleAt = this.time
    }
    commitRoute() {
        this.fear.currentRoute.length >= 2 && (this.fear.routeHistory[this.campaign.state.index] = structuredClone(this.fear.currentRoute))
    }
    routeForCopy() {
        const e = this.campaign.state.index === 7 ? 4 : this.campaign.state.index === 12 ? 7 : this.campaign.state.index - 1;
        if (this.fear.routeHistory[e]?.length) return this.fear.routeHistory[e];
        const t = Object.keys(this.fear.routeHistory).map(Number).filter(i => i < this.campaign.state.index && this.fear.routeHistory[i]?.length).sort((i, s) => s - i)[0];
        return t ? this.fear.routeHistory[t] : []
    }
    resolvePrediction() {
        const e = this.campaign.state.decision;
        if (!e || ![4, 7, 12].includes(this.campaign.state.index) || this.fear.predictionOutcome?.room === this.campaign.state.index) return;
        const t = this.runtime.state,
            i = {
                Persistence: (t.power?.attempts ?? 0) > 1,
                Adaptability: (t.power?.attempts ?? 0) > 1 && !!t.power?.solved,
                Curiosity: !!t.flags.sourceFound || !!t.flags.read,
                "Meta Suspicion": !!t.flags.questioned,
                Greed: !!t.flags.collected,
                "Rule Breaking": !!t.flags.pressed || !!t.flags.early || !!t.flags.violated,
                "Surveillance Awareness": !!t.flags.cameraFound || this.inspected.has("camera"),
                Patience: !!t.flags.waited || !!t.flags.timedOut,
                Caution: !t.flags.early && !t.flags.pressedOptional
            } [e.trait];
        if (i === void 0) return;
        const s = !!i;
        this.fear.predictionOutcome = {
            room: this.campaign.state.index,
            trait: e.trait ?? "CALIBRATION",
            status: s ? "confirmed" : "failed",
            expected: this.predictionBrief()?.expected ?? "FOLLOW THE PREDICTED PROCEDURE",
            time: this.time
        }, s ? this.fear.modelConfirmations++ : this.fear.modelBreaks++, this.fear.predictionHistory.push(structuredClone(this.fear.predictionOutcome)), this.fear.predictionHistory.length > 8 && this.fear.predictionHistory.shift(), this.observe({
            type: "PREDICTION_RESOLVED",
            context: "observation",
            target: e.trait ?? "calibration",
            data: {
                status: s ? "confirmed" : "failed",
                trait: e.trait ?? "CALIBRATION"
            }
        })
    }
    tick(e) {
        if (this.campaign.state.finished) return;
        this.time += e;
        const t = !!this.runtime.state.flags.signal;
        this.runtime.tick(e).forEach(i => this.observe(i)), !t && this.runtime.state.flags.waited && this.resolve("WAIT")
    }
    input(e) {
        this.runtime.definition.kind === "reward" && this.runtime.state.flags.collected && e === "button" || this.runtime.definition.kind === "terminal" && this.runtime.state.flags.answered && (e === "button" || e === "question") || (this.runtime.input(e).forEach(t => this.observe(t)), e === "button" && this.resolve("PRESS"), e === "question" && this.resolve("OTHER"), e === "camera" && this.runtime.definition.kind === "attention" && this.resolve("EXPLORE"))
    }
    inspect(e, t, i, s = 2) {
        this.inspected.has(e) || (this.inspected.add(e), this.observe({
            type: "LOOKED_AT",
            context: t,
            target: e,
            data: {
                optional: i
            },
            duration: s
        }), e === "instruction" && this.input("read"), e === "camera" && this.input("camera"), e === "test-button" && this.observe({
            type: "OPPORTUNITY",
            context: "buttons",
            target: e,
            data: {
                perceived: !0,
                available: !0,
                dangerKnown: !1,
                window: Math.max(1, this.runtime.definition.timeout)
            }
        }))
    }
    interact(e, t, i) {
        const s = i === "button" || i === "door",
            o = this.runtime.definition.kind === "wait";
        this.observe({
            type: "INTERACTED",
            context: t,
            target: e,
            data: {
                decisionEligible: s && !o
            }
        }), i && this.input(i)
    }
    resolve(e) {
        this.predictionId && (this.model.resolvePrediction(this.predictionId, e), this.predictionId = null)
    }
    horrorOpportunity(e, t = {}) {
        if (this.campaign.state.index < 2 || this.campaign.state.index > 12) return;
        const i = this.fear.opportunityQueue;
        if (i.some(s => s.kind === e)) return;
        const s = {
            kind: e,
            ...t,
            time: this.time
        };
        e === "RECHECK" ? i.unshift(s) : i.push(s), i.length > 4 && (i[0]?.kind === "RECHECK" ? i.pop() : i.shift())
    }
    horrorZone(e) {
        const t = `${this.campaign.state.index}:${e}`;
        if (t === this.fear.lastZone) return;
        this.fear.lastZone = t;
        const i = this.fear.zoneVisits[t] ?? 0;
        this.fear.zoneVisits[t] = i + 1, i > 0 && this.time - this.fear.lastReturnAt > 8 && (this.fear.lastReturnAt = this.time, this.horrorOpportunity("RETURN", {
            zone: e
        }))
    }
    horrorExitApproach(e, t) {
        if (!this.runtime.unlocked || this.fear.exitApproachRoom === this.campaign.state.index) return;
        const i = Math.hypot(e, t - this.campaign.room().door.z);
        i < 2.25 && (this.fear.exitApproachRoom = this.campaign.state.index, this.horrorOpportunity("EXIT_APPROACH", {
            distance: +i.toFixed(2)
        }))
    }
    horrorLookAway(e, t = this.fear.perceptionYaw) {
        this.fear.lastLookTarget = e, this.fear.lastLookTime = this.time;
        const i = this.fear.lastAnomalyTarget === e && this.fear.anomalyPerceived && this.time - this.fear.lastAnomaly < 16,
            s = e === "observation-window" && this.campaign.state.index === 11 && !!this.fear.previousRoomSnapshot && (this.fear.windowFixation > 0);
        (i || s) && (this.fear.lookAwayCandidateTarget = e, this.fear.lookAwayCandidateType = i ? this.fear.lastType : "previous_room", this.fear.lookAwayCandidateYaw = Number.isFinite(this.fear.perceptionYaw) ? this.fear.perceptionYaw : t, this.fear.lookAwayCandidateAt = this.time)
    }
    horrorPerception(e, t = 0, i = this.fear.perceptionYaw) {
        if (this.fear.lookAwayCandidateTarget) {
            const s = Math.abs(Math.atan2(Math.sin(i - this.fear.lookAwayCandidateYaw), Math.cos(i - this.fear.lookAwayCandidateYaw)));
            e === this.fear.lookAwayCandidateTarget ? (this.fear.lookAwayCandidateTarget = null, this.fear.lookAwayCandidateType = null) : this.time - this.fear.lookAwayCandidateAt > 4.5 ? (this.fear.lookAwayCandidateTarget = null, this.fear.lookAwayCandidateType = null) : s >= Math.PI / 4 && (this.fear.recheckArmedTarget = this.fear.lookAwayCandidateTarget, this.fear.recheckArmedType = this.fear.lookAwayCandidateType, this.fear.recheckArmedAt = this.time, this.fear.lookAwayCandidateTarget = null, this.fear.lookAwayCandidateType = null)
        }
        if (!e) {
            this.fear.perceptionTarget = "", this.fear.perceptionDwell = 0;
            return
        }
        this.fear.perceptionTarget !== e && (this.fear.perceptionTarget = e, this.fear.perceptionDwell = 0);
        const s = this.fear.lastAnomalyTarget === e && this.time - this.fear.lastAnomaly < 16,
            o = e === "observation-window" && this.threat.windowObserver?.visible,
            n = e === "camera" && ["camera", "camera_reposition", "camera_led"].includes(this.threat.phase);
        s || o || n ? (this.fear.perceptionDwell += Math.max(0, t), this.fear.perceptionYaw = i, this.fear.perceptionDwell >= .45 && (this.fear.anomalyPerceived = !0)) : this.fear.perceptionDwell = 0
    }
    horrorLookAt(e) {
        const t = this.time - this.fear.recheckArmedAt,
            i = this.fear.recheckArmedType ?? this.fear.lastType;
        if (this.fear.recheckArmedTarget === e && t >= .8 && t <= 4.5) {
            this.fear.verification++, this.fear.recheckTimes = this.fear.recheckTimes.filter(s => this.time - s <= 12), this.fear.recheckTimes.push(this.time), this.fear.recheckTimes.length >= 3 && (this.fear.tripleCheck++, this.fear.recheckTimes = []), this.fear.recheckPulse = !0, this.fear.recheckTarget = e, this.fear.recheckType = i, this.fear.reactionPulse += 1, this.observe({
                type: "ANOMALY_RECHECK",
                context: e === "camera" ? "cameras" : "observation",
                target: e,
                data: {
                    verification: !0,
                    anomaly: i
                }
            }), this.horrorOpportunity("RECHECK", {
                target: e,
                anomaly: i
            }), this.fear.verification >= 2 && this.queueSystemCallback("checked", "YOU CHECKED AGAIN.", 2), this.fear.recheckArmedTarget = null, this.fear.recheckArmedType = null
        }
        t > 4.5 && (this.fear.recheckArmedTarget = null, this.fear.recheckArmedType = null), e === "camera" && this.fear.cameraFixation++, e === "observation-window" && this.fear.windowFixation++
    }
    queueSystemCallback(e, t, i = 2) {
        if (this.fear.callbackKeys[e] || this.campaign.state.index >= 11) return;
        const s = Math.min(11, this.campaign.state.index + i + (this.fear.pendingCallbacks.length % 2));
        this.fear.callbackKeys[e] = "queued", this.fear.pendingCallbacks.push({
            key: e,
            text: t,
            dueRoom: s,
            shown: !1
        })
    }
    consumeSystemCallback() {
        const e = this.fear.pendingCallbacks.find(t => !t.shown && t.dueRoom <= this.campaign.state.index);
        return e ? (e.shown = !0, this.fear.callbackKeys[e.key] = "shown", this.fear.activeSystemText = e.text, e.text) : (this.fear.activeSystemText = "RESPONSE RECORDED.", this.fear.activeSystemText)
    }
    clearSystemCallback() {
        this.fear.activeSystemText = ""
    }
    maybeExpected(e) {
        const t = HorrorLibraryV012[this.fear.lastType];
        t && t.targets.includes(e) && this.fear[e] >= 2 && this.queueSystemCallback("expected", "EXPECTED.", 2)
    }
    horrorEvent(e, t = 0, i = 0, s = 0, o = !1) {
        if (["baseline", "end", "no_event", "post_blackout"].includes(e)) return;
        const n = HorrorLibraryV012[e],
            r = HorrorTargetV012(e),
            c = this.campaign.room(),
            u = ["step", "extra_step", "mimic_steps"].includes(e),
            d = e === "observer_behind",
            l = r === "camera",
            y = r === "observation-window",
            m = r === "door",
            g = ["blackout", "blackout_prop", "blackout_observer", "fixture_off", "sector_failure", "stutter", "lightdip"].includes(e);
        this.fear.lastAnomaly = this.time, this.fear.lastType = e, this.fear.lastAnomalyTarget = r, this.fear.anomalyPerceived = !1, this.fear.perceptionTarget = "", this.fear.perceptionDwell = 0, this.fear.recheckArmedTarget = null, this.fear.recheckArmedType = null, this.fear.lookAwayCandidateTarget = null, this.fear.lookAwayCandidateType = null, this.fear.anomalyYaw = t, this.fear.anomalyPlayerX = i, this.fear.anomalyPlayerZ = s;
        this.fear.anomalySourceX = e === "speaker_click" ? 2.15 : d ? this.threat.windowObserver.lookBehindX ?? i + Math.sin(t) * 2.2 : u ? i + Math.sin(t) * 1.8 : l ? c.size.width / 2 - .5 : y ? c.size.width / 2 + (this.threat.windowObserver.depth ?? 1.45) : m ? c.door.x : this.threat.plan.cueX;
        this.fear.anomalySourceZ = e === "speaker_click" ? c.door.z + .2 : d ? this.threat.windowObserver.lookBehindZ ?? s + Math.cos(t) * 2.2 : u ? s + Math.cos(t) * 1.8 : l ? -c.size.depth / 2 + .8 : y ? this.threat.windowObserver.z : m ? c.door.z : this.threat.plan.cueZ;
        this.fear.flashlightAtAnomaly = o, this.fear.responseRecorded = !1, this.fear.freezeTime = 0, this.fear.fleeCandidateActive = !1, this.fear.fleeCandidateSince = -999, this.fear.fleeCandidateDistance = 0, this.fear.fleeLastDistance = 0, this.fear.lookBackRecorded = !1, g && (this.fear.darknessRecorded = !1, this.fear.darknessEpisodeActive = !1, this.fear.darknessExposure = 0), this.fear.positionRecorded = !1, this.fear.exitRecorded = !1, this.fear.reactionPulse += n?.intensity ?? 1, this.fear.globalTension = this.threat.tension, this.fear.recentPeak = Math.max(this.fear.recentPeak, this.threat.recentPeak ?? 0);
        if (n) {
            this.fear.lastFamilyRoom[n.family] = this.campaign.state.index, this.fear.lastTypeRoom[e] = this.campaign.state.index, n.intensity >= 4 && (this.fear.lastMajorRoom = this.campaign.state.index)
        }
        this.observe({
            type: "HORROR_EVENT",
            context: "observation",
            target: e,
            data: {
                style: this.threat.style,
                tension: this.threat.tension,
                family: n?.family,
                target: r
            }
        })
    }
    horrorResponse(e, t, i, s, o, n, r, c) {
        n > this.campaign.room().door.z + .2 && (this.fear.lastRoomPlayer = {
            x: o,
            z: n,
            yaw: s
        });
        const u = this.time - this.fear.lastAnomaly;
        if (t) this.fear.stillnessTime = 0;
        else if (!this.runtime.unlocked && this.campaign.state.index >= 4) {
            this.fear.stillnessTime += e;
            this.fear.stillnessTime > 4.8 && this.time - this.fear.lastStillnessAt > 18 && (this.fear.lastStillnessAt = this.time, this.fear.stillnessTime = 0, this.horrorOpportunity("LONG_STILLNESS"))
        }
        const d = !!this.runtime.state.flags.blackout || ["blackout", "blackout_prop", "blackout_observer", "hunt_blackout", "fixture_off", "sector_failure"].includes(this.threat.phase);
        if (d) {
            this.fear.darknessEpisodeActive || (this.fear.darknessEpisodeActive = !0, this.fear.darknessExposure = 0, this.fear.darknessStartedWithFlashlight = r, this.fear.darknessRecorded = !1), this.fear.darknessExposure += e;
            if (!this.fear.darknessRecorded) {
                if (r && !this.fear.darknessStartedWithFlashlight && this.fear.darknessExposure <= 1.5) this.fear.flashlightDependence++, this.fear.reactionPulse += .6, this.fear.darknessRecorded = !0, this.maybeExpected("flashlightDependence");
                else if (!r && this.fear.darknessExposure >= 4) this.fear.darknessTolerance++, this.fear.reactionPulse += .4, this.fear.darknessRecorded = !0, this.maybeExpected("darknessTolerance")
            }
        } else this.fear.darknessEpisodeActive && (this.fear.darknessEpisodeActive = !1, this.fear.darknessExposure = 0, this.fear.darknessStartedWithFlashlight = !1);
        if (u < 0 || u > 5) return;
        const l = ["impact", "step", "extra_step", "mimic_steps", "speaker_click"].includes(this.fear.lastType),
            y = this.fear.lastType === "observer_behind",
            m = Math.hypot(this.fear.anomalyPlayerX - this.fear.anomalySourceX, this.fear.anomalyPlayerZ - this.fear.anomalySourceZ),
            g = Math.hypot(o - this.fear.anomalySourceX, n - this.fear.anomalySourceZ),
            E = Math.hypot(this.fear.anomalyPlayerX, this.fear.anomalyPlayerZ - this.campaign.room().door.z),
            P = Math.hypot(o, n - this.campaign.room().door.z);
        if (!this.fear.responseRecorded) {
            t ? this.fear.freezeTime = 0 : this.fear.freezeTime += e;
            if (this.fear.freezeTime >= 1.3) this.fear.freeze++, this.fear.reactionPulse += .8, this.fear.responseRecorded = !0, this.maybeExpected("freeze");
            else if (!this.fear.fleeCandidateActive && u <= 1.2 && i && g > m + .04) this.fear.fleeCandidateActive = !0, this.fear.fleeCandidateSince = this.time, this.fear.fleeCandidateDistance = g, this.fear.fleeLastDistance = g;
            else if (this.fear.fleeCandidateActive) {
                if (!i || g < this.fear.fleeLastDistance - .04) this.fear.fleeCandidateActive = !1;
                else if (this.fear.fleeLastDistance = g, this.time - this.fear.fleeCandidateSince >= 2 && g >= this.fear.fleeCandidateDistance + .65) this.fear.flee++, this.fear.reactionPulse += 1.2, this.fear.responseRecorded = !0, this.fear.fleeCandidateActive = !1, this.maybeExpected("flee")
            }
        }
        if (!this.fear.exitRecorded && c && u < 3.4 && P < E - .65) {
            this.fear.exitUrgency++, this.fear.exitRecorded = !0, this.fear.reactionPulse += .6, this.maybeExpected("exitUrgency")
        }
        if (!this.fear.lookBackRecorded && (l || y) && u <= (y ? 4.5 : 2.5)) {
            const S = this.fear.anomalySourceX - o,
                k = this.fear.anomalySourceZ - n,
                I = Math.hypot(S, k) || 1,
                L = -Math.sin(s),
                V = -Math.cos(s),
                F = (L * S + V * k) / I,
                G = this.fear.anomalySourceX - this.fear.anomalyPlayerX,
                $ = this.fear.anomalySourceZ - this.fear.anomalyPlayerZ,
                bt = Math.hypot(G, $) || 1,
                rt = (-Math.sin(this.fear.anomalyYaw) * G + -Math.cos(this.fear.anomalyYaw) * $) / bt,
                ct = Math.abs(Math.atan2(Math.sin(s - this.fear.anomalyYaw), Math.cos(s - this.fear.anomalyYaw)));
            rt < -.34 && ct > 1.92 && F > .82 && (this.fear.lookBack++, this.fear.reactionPulse += .7, this.fear.lookBackRecorded = !0, this.observe({
                type: "LOOK_BACK_RESPONSE",
                context: y ? "observation" : "sound",
                target: this.fear.lastType,
                data: {
                    towardSource: !0,
                    causedByObserverGaze: y
                }
            }), this.fear.lookBack >= 2 && this.queueSystemCallback("turned", "YOU TURNED AROUND.", 2), this.maybeExpected("lookBack"))
        }
        if (!this.fear.positionRecorded && u > .8 && t) {
            g <= m * .65 ? (this.fear.approach++, l && this.fear.soundInvestigation++, this.fear.reactionPulse += .6, this.maybeExpected(l ? "soundInvestigation" : "approach"), this.fear.positionRecorded = !0) : g >= m * 1.25 && (this.fear.avoidance++, this.maybeExpected("avoidance"), this.fear.positionRecorded = !0)
        }
    }
    fearSnapshot() {
        this.fear.globalTension = this.threat.tension, this.fear.recentPeak = this.threat.recentPeak;
        const t = this.threat.phase === "baseline" ? this.fear.opportunityQueue.splice(0, 1) : [];
        const e = {
            ...this.fear,
            opportunities: t,
            hasPreviousRoom: !!this.fear.previousRoomSnapshot,
            confidence: {
                verification: Math.min(1, this.fear.verification / 3),
                lookBack: Math.min(1, this.fear.lookBack / 3),
                freeze: Math.min(1, this.fear.freeze / 3),
                flee: Math.min(1, this.fear.flee / 3),
                approach: Math.min(1, this.fear.approach / 3),
                avoidance: Math.min(1, this.fear.avoidance / 3),
                soundInvestigation: Math.min(1, this.fear.soundInvestigation / 3),
                darknessTolerance: Math.min(1, this.fear.darknessTolerance / 3),
                flashlightDependence: Math.min(1, this.fear.flashlightDependence / 3),
                exitUrgency: Math.min(1, this.fear.exitUrgency / 3),
                cameraFixation: Math.min(1, this.fear.cameraFixation / 4),
                windowFixation: Math.min(1, this.fear.windowFixation / 4)
            }
        };
        return this.fear.recheckPulse = !1, this.fear.reactionPulse = 0, e
    }
    capturePreviousRoom(e, t, i, s = 0) {
        const o = this.campaign.room(),
            n = this.runtime.definition;
        this.fear.previousRoomSnapshot = {
            roomIndex: this.campaign.state.index,
            title: n.title,
            kind: n.kind,
            size: {
                ...o.size
            },
            door: {
                ...o.door
            },
            doorOpen: Math.max(0, Math.min(1, s)),
            presentation: structuredClone(n.presentation),
            lighting: structuredClone(o.lighting),
            props: o.props.map(r => ({
                id: r.id,
                kind: r.kind,
                x: r.x,
                z: r.z,
                width: r.width,
                depth: r.depth,
                open: !!this.runtime.state.flags[`cabinet-open:${r.id}`]
            })),
            signal: !!this.runtime.state.flags.signal,
            emergency: !!this.runtime.state.flags.emergency,
            blackout: !!this.runtime.state.flags.blackout,
            cameraInspected: this.inspected.has("camera"),
            cameraYaw: this.threat.cameraYaw,
            observerState: structuredClone(this.threat.windowObserver),
            player: {
                ...(this.fear.lastRoomPlayer ?? {
                    x: e,
                    z: t,
                    yaw: i
                })
            }
        }
    }
    horrorReportLines(e) {
        const t = this.fear,
            i = [];
        t.verification > 0 && i.push(`VISUAL CONFIRMATIONS: ${t.verification}`), t.tripleCheck > 0 && i.push(`ANOMALY TRIPLE-CHECKS: ${t.tripleCheck}`), t.lookBack > 0 && i.push(`TURNED TOWARD CUE: ${t.lookBack}`), t.cameraFixation > 0 && i.push(`CAMERA CHECKS: ${t.cameraFixation}`), t.windowFixation > 0 && i.push(`WINDOW CHECKS: ${t.windowFixation}`), t.flashlightDependence > 0 && i.push(`LIGHT FAILURE: FLASHLIGHT · ${t.flashlightDependence}`), t.darknessTolerance > 0 && i.push(`DARKNESS TOLERATED: ${t.darknessTolerance}`), t.freeze > 0 && i.push(`FREEZE RESPONSE: ${t.freeze}`), t.flee > 0 && i.push(`FLIGHT RESPONSE: ${t.flee}`), t.exitUrgency > 0 && i.push(`EXIT RUSH: ${t.exitUrgency}`), i.length || i.push("NO CONFIRMED FEAR RESPONSE");
        const s = Math.max(1, Math.min(i.length, Math.floor(e / 1.05) + 1)),
            o = ["PREDICTIVE IDENTITY RECORD", ...i.slice(0, s)],
            n = this.ending();
        return e >= 7.2 && o.push(`MODEL CONFIRMATIONS: ${t.modelConfirmations}`), e >= 8.1 && o.push(`MODEL BREAKS: ${t.modelBreaks}`), e >= 9.1 && o.push(n.report), o
    }
    horrorReport(e) {
        return this.horrorReportLines(e).at(-1)
    }
    ending() {
        const e = this.fear.modelBreaks,
            t = this.fear.modelConfirmations;
        return e >= 2 && e > t ? {
            kind: "original",
            title: "Модель не завершена.",
            copy: "Система не смогла предсказать маршрут. Допуск выдан исходному участнику.",
            code: "ORIGINAL CLEARED",
            report: "REPLICA STATUS: INCOMPLETE"
        } : t >= 2 && t > e ? {
            kind: "replica",
            title: "Реплика завершена.",
            copy: "Система выпустила запись, которая точнее всего соответствовала прогнозу.",
            code: "REPLICA CLEARED",
            report: "ORIGINAL STATUS: CONTAINED"
        } : {
            kind: "conflict",
            title: "Идентичность не подтверждена.",
            copy: "Комплекс зарегистрировал два совместимых маршрута. Наружу вышли оба.",
            code: "TWO RECORDS CLEARED",
            report: "OCCUPANCY AFTER EXIT: 2"
        }
    }
    advance() {
        if (this.campaign.state.finished) return !1;
        if (!this.runtime.unlocked) throw new Error("Exit is locked");
        return this.resolvePrediction(), this.commitRoute(), this.runtime.state.power?.location === "hand" && (this.runtime.state.power.location = "stand"), this.input("exit"), this.resolve("OTHER"), this.observe({
            type: "ROOM_SUCCESS",
            context: "navigation",
            target: "exit"
        }), this.campaign.complete(this.runtime, this.model.snapshot(), this.inspected.has("camera"), this.fear.predictionOutcome), this.campaign.state.finished || (this.runtime = new we(this.campaign.experiment()), this.threat = Me(this.campaign.room(), this.campaign.state.index, new ie().fearStrategy(this.model.snapshot()), this.campaign.state.seed, this.fear), this.enterRoom()), !this.campaign.state.finished
    }
    exportState() {
        return structuredClone({
            campaign: this.campaign.state,
            experiment: this.runtime.state,
            behavior: this.model.exportState(),
            time: this.time,
            sequence: this.sequence,
            inspected: [...this.inspected],
            zones: [...this.zones],
            predictionId: this.predictionId,
            threat: this.threat,
            fear: this.fear,
            deaths: this.deaths
        })
    }
}
class te {
    static key = "observed-engine-0.9-save";
    static checkpointKey = "observed-engine-0.9-checkpoint";
    save(e, t = !1) {
        this.validate(e), localStorage.setItem(t ? te.checkpointKey : te.key, JSON.stringify(e))
    }
    load(e = !1) {
        const t = localStorage.getItem(e ? te.checkpointKey : te.key);
        if (!t) return null;
        const i = JSON.parse(t);
        return this.validate(i), i
    }
    validate(e) {
        if (!e || ![2, 3].includes(e.version) || !e.session || !e.player || ![e.player.x, e.player.z, e.player.yaw, e.player.pitch, e.doorOpen].every(Number.isFinite) || Math.abs(e.player.pitch) > 1.35 || e.doorOpen < 0 || e.doorOpen > 1 || [e.doorTarget, e.emergency, e.flashlight].some(s => typeof s != "boolean")) throw new Error("Повреждённое сохранение кампании.");
        const t = new st(e.session.campaign.seed, e.session),
            i = t.campaign.room();
        if (Math.abs(e.player.x) > i.size.width / 2 - .2 || e.player.z > i.size.depth / 2 - .2 || e.player.z < i.door.z - 3.15 || e.player.z < i.door.z && Math.abs(e.player.x) > 1.16) throw new Error("Позиция вне помещения.");
        if ((e.doorTarget || e.doorOpen > 0) && !t.runtime.unlocked) throw new Error("Дверь не соответствует состоянию испытания.")
    }
}

function Ye(a, e = !1) {
    const t = a[0].index !== null,
        i = new Set(Object.keys(a[0].attributes)),
        s = new Set(Object.keys(a[0].morphAttributes)),
        o = {},
        n = {},
        r = a[0].morphTargetsRelative,
        c = new yt;
    let u = 0;
    for (let d = 0; d < a.length; ++d) {
        const l = a[d];
        let y = 0;
        if (t !== (l.index !== null)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + d + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."), null;
        for (const m in l.attributes) {
            if (!i.has(m)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + d + '. All geometries must have compatible attributes; make sure "' + m + '" attribute exists among all geometries, or in none of them.'), null;
            o[m] === void 0 && (o[m] = []), o[m].push(l.attributes[m]), y++
        }
        if (y !== i.size) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + d + ". Make sure all geometries have the same number of attributes."), null;
        if (r !== l.morphTargetsRelative) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + d + ". .morphTargetsRelative must be consistent throughout all geometries."), null;
        for (const m in l.morphAttributes) {
            if (!s.has(m)) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + d + ".  .morphAttributes must be consistent throughout all geometries."), null;
            n[m] === void 0 && (n[m] = []), n[m].push(l.morphAttributes[m])
        }
        if (e) {
            let m;
            if (t) m = l.index.count;
            else if (l.attributes.position !== void 0) m = l.attributes.position.count;
            else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + d + ". The geometry must have either an index or a position attribute"), null;
            c.addGroup(u, m, d), u += m
        }
    }
    if (t) {
        let d = 0;
        const l = [];
        for (let y = 0; y < a.length; ++y) {
            const m = a[y].index;
            for (let g = 0; g < m.count; ++g) l.push(m.getX(g) + d);
            d += a[y].attributes.position.count
        }
        c.setIndex(l)
    }
    for (const d in o) {
        const l = Ke(o[d]);
        if (!l) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + d + " attribute."), null;
        c.setAttribute(d, l)
    }
    for (const d in n) {
        const l = n[d][0].length;
        if (l === 0) break;
        c.morphAttributes = c.morphAttributes || {}, c.morphAttributes[d] = [];
        for (let y = 0; y < l; ++y) {
            const m = [];
            for (let E = 0; E < n[d].length; ++E) m.push(n[d][E][y]);
            const g = Ke(m);
            if (!g) return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + d + " morphAttribute."), null;
            c.morphAttributes[d].push(g)
        }
    }
    return c
}

function Ke(a) {
    let e, t, i, s = -1,
        o = 0;
    for (let u = 0; u < a.length; ++u) {
        const d = a[u];
        if (e === void 0 && (e = d.array.constructor), e !== d.array.constructor) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."), null;
        if (t === void 0 && (t = d.itemSize), t !== d.itemSize) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."), null;
        if (i === void 0 && (i = d.normalized), i !== d.normalized) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."), null;
        if (s === -1 && (s = d.gpuType), s !== d.gpuType) return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."), null;
        o += d.count * t
    }
    const n = new e(o),
        r = new vt(n, t, i);
    let c = 0;
    for (let u = 0; u < a.length; ++u) {
        const d = a[u];
        if (d.isInterleavedBufferAttribute) {
            const l = c / t;
            for (let y = 0, m = d.count; y < m; y++)
                for (let g = 0; g < t; g++) {
                    const E = d.getComponent(y, g);
                    r.setComponent(y + l, g, E)
                }
        } else n.set(d.array, c);
        c += d.count * t
    }
    return s !== void 0 && (r.gpuType = s), r
}
class bi {
    boxes = [];
    add(e, t, i, s, o) {
        const n = {
            id: e,
            minX: t - s / 2,
            maxX: t + s / 2,
            minZ: i - o / 2,
            maxZ: i + o / 2,
            enabled: !0
        };
        return this.boxes.push(n), n
    }
    blocked(e, t, i = .24) {
        return this.boxes.some(s => s.enabled && Math.hypot(e - Math.max(s.minX, Math.min(e, s.maxX)), t - Math.max(s.minZ, Math.min(t, s.maxZ))) < i)
    }
    move(e, t, i, s, o = .24) {
        const n = Math.max(1, Math.ceil(Math.hypot(i, s) / (o * .5)));
        for (let r = 0; r < n; r++) this.blocked(e + i / n, t, o) || (e += i / n), this.blocked(e, t + s / n, o) || (t += s / n);
        return {
            x: e,
            z: t
        }
    }
    occlusion(e, t) {
        const i = Math.hypot(e.x - t.x, e.z - t.z),
            s = Math.ceil(i / .15);
        for (let o = 1; o < s; o++)
            if (this.blocked(e.x + (t.x - e.x) * o / s, e.z + (t.z - e.z) * o / s, .02)) return .75;
        return 0
    }
}
class wi {
    textures = new Map;
    texture(e) {
        if (this.textures.has(e)) return this.textures.get(e);
        const t = document.createElement("canvas");
        t.width = t.height = 128;
        const i = t.getContext("2d"),
            s = new B(`observed-material-${e}-1`),
            o = e === "wall" ? [125, 129, 113] : e === "floor" ? [86, 94, 87] : e === "ceiling" ? [123, 129, 118] : [67, 80, 75];
        for (let r = 0; r < 128; r++)
            for (let c = 0; c < 128; c++) {
                const u = Math.floor(s.next() * 12) - 6,
                    d = e === "wall" && r > 76 ? .59 : 1;
                i.fillStyle = `rgb(${o.map(l=>Math.floor((l+u)*d)).join(",")})`, i.fillRect(c, r, 1, 1)
            }
        if (i.strokeStyle = "rgba(15,24,22,.5)", i.lineWidth = 2, i.strokeRect(0, 0, 128, 128), e === "ceiling")
            for (let r = 0; r < 110; r++) i.fillStyle = "rgba(25,30,24,.3)", i.fillRect(s.int(4, 124), s.int(4, 124), 2, 1);
        if (e === "floor") {
            i.strokeStyle = "rgba(170,178,146,.15)", i.strokeRect(3, 3, 122, 122);
            for (let r = 0; r < 22; r++) i.fillStyle = "rgba(10,15,12,.2)", i.fillRect(s.int(0, 127), s.int(0, 127), s.int(2, 12), 1)
        }
        if (e === "wall") {
            i.fillStyle = "#667066", i.fillRect(0, 76, 128, 2);
            for (let r = 0; r < 20; r++) i.fillStyle = "rgba(28,32,26,.08)", i.fillRect(s.int(0, 127), 0, s.int(1, 3), s.int(10, 85))
        }
        if (e === "metal") {
            for (let r = 8; r < 128; r += 16) i.fillStyle = "rgba(10,20,15,.35)", i.fillRect(r, 0, 1, 128);
            i.fillStyle = "#829083", i.fillRect(3, 3, 2, 2), i.fillRect(123, 123, 2, 2)
        }
        const n = new Ue(t);
        return n.colorSpace = Be, n.magFilter = ge, n.minFilter = xt, n.wrapS = n.wrapT = Et, this.textures.set(e, n), n
    }
    sign(e, t = 512, i = 256, s = "#d4d9b7", o = "#182724") {
        const n = JSON.stringify([e, t, i, s, o]);
        if (this.textures.has(n)) return this.textures.get(n);
        const r = document.createElement("canvas");
        r.width = t, r.height = i;
        const c = r.getContext("2d");
        c.fillStyle = o, c.fillRect(0, 0, t, i), c.strokeStyle = s, c.lineWidth = 3, c.strokeRect(10, 10, t - 20, i - 20), c.textAlign = "center", c.textBaseline = "middle";
        const u = Math.min(i / (e.length + 1), t / (Math.max(...e.map(l => l.length)) * .68));
        c.font = `bold ${u}px monospace`, c.fillStyle = s, e.forEach((l, y) => c.fillText(l, t / 2, i * (y + 1) / (e.length + 1)));
        const d = new Ue(r);
        return d.colorSpace = Be, d.magFilter = ge, d.minFilter = Ot, this.textures.set(n, d), d
    }
    dispose() {
        for (const e of this.textures.values()) e.dispose();
        this.textures.clear()
    }
}
class yi {
    constructor(e, t, i, a = null, p = null) {
        this.definition = e, this.experiment = t, this.roomIndex = i;
        const s = e,
            {
                width: o,
                depth: n,
                height: r
            } = s.size,
            c = String(i).padStart(3, "0"),
            u = t.presentation.mood;
        this.scene.background = new St(u === "clinical" ? "#131b17" : u === "degraded" ? "#17130f" : "#0d1816"), this.scene.fog = new Tt(u === "degraded" ? "#17130f" : "#111b17", u === "surveillance" ? .034 : .028);
        const d = this.mat("wall"),
            l = this.mat("floor"),
            y = this.mat("ceiling"),
            m = this.mat("metal"),
            g = this.solid("#354a42"),
            E = this.solid("#0b1514"),
            P = this.solid("#544936"),
            S = this.solid("#050908"),
            k = this.solid("#73786d", "#444a41", .06);
        this.scene.add(this.observer), this.observer.visible = !1, this.box(.34, 1.42, .22, 0, 1.34, 0, S, this.observer), this.box(.7, .08, .2, 0, 1.97, 0, S, this.observer);
        for (const p of [-.12, .12]) this.observerLimbs.push(this.box(.085, 1.08, .09, p, .54, 0, S, this.observer));
        this.observerLimbs.push(this.box(.075, 1.62, .08, -.32, 1.16, .01, S, this.observer), this.box(.07, 1.48, .08, .32, 1.23, -.01, S, this.observer)), this.observerHead.position.set(.035, 2.23, 0), this.observer.add(this.observerHead);
        const I = new kt(.225, 1),
            L = new K(I, S);
        if (L.scale.y = 1.28, L.castShadow = !0, this.observerHead.add(L), this.observerFace = this.box(.13, .27, .025, 0, -.015, .207, k, this.observerHead), this.box(.012, .23, .012, .018, -.02, .224, S, this.observerHead), this.observer.traverse(p => p.layers.mask = 0), t.powerSocket) {
            const p = Ie(s);
            for (const v of Ce(s)) {
                const z = v.id.startsWith("partition");
                this.box(v.width, z ? 2.7 : .8, v.depth, v.x, z ? 1.35 : .4, v.z, z ? d : m), this.collision.add(v.id, v.x, v.z, v.width, v.depth)
            }
            for (const v of ["a", "b"]) {
                const z = p[v],
                    F = new W;
                F.position.set(z.x, 0, z.z), this.scene.add(F), this.tag(F, {
                    id: `socket-${v}`,
                    context: "power",
                    label: `E · ${v==="a"?"LIGHT / ЛЕВОЕ":"EXIT / ПРАВОЕ"} — ВСТАВИТЬ / ИЗВЛЕЧЬ`,
                    optional: !1,
                    action: "power",
                    powerAction: `socket-${v}`
                }), this.box(.46, .52, .36, 0, 1.05, 0, m, F), this.box(.25, .14, .02, 0, 1.12, .19, E, F), this.sign([v === "a" ? "LIGHT" : "EXIT"], .42, .18, 0, .87, .2, "#c9d8aa", "#263b2d", F)
            }
            const O = this.solid("#c2c8b0", "#667255", .35);
            this.fuse = this.box(.28, .12, .12, 0, .94, p.stand.z, O), this.heldFuse = this.box(.28, .12, .12, 0, 0, 0, O), this.heldFuse.visible = !1, this.heldFuse.castShadow = !1;
            for (const v of [this.fuse, this.heldFuse]) {
                for (const z of [-.115, .115]) this.box(.055, .13, .13, z, 0, 0, m, v);
                this.sign(["F-01"], .15, .065, 0, 0, .066, "#23312a", "#c2c8b0", v)
            }
            this.sign(["SERVICE ITEMS", "REMAIN HERE"], 1.5, .4, 0, 3.13, s.door.z + .04)
        }
        this.box(o, .2, n, 0, -.1, 0, l), this.box(o, .18, n, 0, r + .09, 0, y), this.wall(.2, r, n, -o / 2 - .1, r / 2, 0, d), this.wall(.2, 1.34, n, o / 2 + .1, .67, 0, d), this.wall(.2, r - 2.45, n, o / 2 + .1, 2.45 + (r - 2.45) / 2, 0, d), this.wall(.2, 1.11, Math.max(.2, n / 2 - 1.12), o / 2 + .1, 1.895, -(n / 4 + .56), d), this.wall(.2, 1.11, Math.max(.2, n / 2 - 1.12), o / 2 + .1, 1.895, n / 4 + .56, d), this.collision.add("observation-glass", o / 2, 0, .22, 2.18), this.wall(o, r, .2, 0, r / 2, n / 2 + .1, d);
        const V = (o - s.door.width) / 2;
        this.wall(V, r, .2, -o / 2 + V / 2, r / 2, -n / 2 - .1, d), this.wall(V, r, .2, o / 2 - V / 2, r / 2, -n / 2 - .1, d), this.box(s.door.width, r - s.door.height, .2, 0, s.door.height + (r - s.door.height) / 2, -n / 2 - .1, d);
        for (const p of [-o / 2 + .035, o / 2 - .035]) this.box(.07, .13, n, p, .13, 0, g), this.box(.07, .07, n, p, 1.32, 0, g);
        this.box(o, .13, .06, 0, .13, n / 2 - .035, g);
        for (const p of [-.94, .94]) this.box(.24, 2.85, .32, p, 1.425, -n / 2, g);
        this.box(2.12, .26, .35, 0, 2.83, -n / 2, g), this.door = new W, this.door.position.set(0, 0, -n / 2), this.scene.add(this.door), this.tag(this.door, {
            id: "door",
            context: "doors",
            label: "E  ·  ДВЕРЬ",
            optional: !1,
            action: "door"
        });
        const rt = this.box(1.58, 2.58, .16, 0, 1.29, 0, m, this.door);
        this.tag(rt, {
            id: "door",
            context: "doors",
            label: "E  ·  ДВЕРЬ",
            optional: !1,
            action: "door"
        }), this.box(1.24, .08, .04, 0, .28, .1, P, this.door), this.box(1.24, .08, .04, 0, 2.3, .1, P, this.door), this.sign([i === 11 ? "010" : c], .75, .48, 0, 1.9, .095, "#c8d1b0", "#25342e", this.door);
        const ct = this.box(.32, .055, .12, .42, 1.02, .14, g, this.door);
        this.tag(ct, {
            id: "door",
            context: "doors",
            label: "E  ·  ДВЕРЬ",
            optional: !1,
            action: "door"
        }), this.doorCollider = this.collision.add("door", 0, -n / 2, 1.6, .25);
        const lt = this.box(.3, .5, .15, 1.35, 1.25, -n / 2 + .12, m);
        this.tag(lt, {
            id: "door-panel",
            context: "buttons",
            label: "E  ·  РЕЛЕ ДОСТУПА",
            optional: !1,
            action: "door"
        });
        const dt = t.presentation.signalMode === "door-lamp",
            ht = t.presentation.exitCue === "amber" ? "#9a6427" : t.presentation.exitCue === "dark" ? "#334039" : "#527d54",
            ut = t.presentation.exitCue === "amber" ? "#d98c31" : t.presentation.exitCue === "dark" ? "#28362d" : "#8ea94f",
            $e = this.solid(ht, ut, dt || t.presentation.exitCue === "dark" ? .08 : 1.3);
        this.doorSignalMaterial = $e, this.box(.15, .08, .03, 1.35, 1.34, -n / 2 + .21, $e), this.sign([t.title], 2.3, .7, -2.35, 2.55, -n / 2 + .015);
        const pt = this.sign(t.sign, 2.5, 1.15, -2.35, 1.55, -n / 2 + .018, "#cbd2b7", "#25372f");
        if (this.tag(pt, {
                id: "instruction",
                context: "instructions",
                label: t.instruction,
                optional: !1,
                action: "inspect"
            }), t.button && t.presentation.device && t.presentation.device !== "button") {
            const p = Re(s, t);
            if (this.buttonPoint = p, this.box(.5, .74, .5, p.x, .37, p.z, m), this.collision.add("device", p.x, p.z, .5, .5), t.presentation.device === "reward") this.rewardMesh = this.box(.24, .12, .24, p.x, .86, p.z, this.solid("#b99c55", "#ac7a29", .65)), this.tag(this.rewardMesh, {
                id: "reward-token",
                context: "rewards",
                label: "E · ЗАБРАТЬ ЖЕТОН — ОСНОВНОЙ СВЕТ ОТКЛЮЧИТСЯ",
                optional: !0,
                action: "button"
            }), this.sign(["OPTIONAL", "CREDIT"], .45, .25, p.x, .6, p.z + .26);
            else {
                const O = this.box(.46, .48, .15, p.x, 1.15, p.z, this.solid("#264136", "#699b74", .5));
                this.tag(O, {
                    id: "terminal-accept",
                    context: "observation",
                    label: "E · ПРИНЯТЬ: «МОИ ДЕЙСТВИЯ ПРЕДСКАЗУЕМЫ»",
                    optional: !0,
                    action: "button"
                }), this.tag(this.sign(["ACCEPT"], .4, .18, p.x, 1.15, p.z + .08), {
                    id: "terminal-accept",
                    context: "observation",
                    label: "E · ПРИНЯТЬ: «МОИ ДЕЙСТВИЯ ПРЕДСКАЗУЕМЫ»",
                    optional: !0,
                    action: "button"
                });
                const v = this.box(.44, .12, .28, p.x, .81, p.z + .06, this.solid("#875421", "#9b6532", .4));
                this.tag(v, {
                    id: "terminal-question",
                    context: "observation",
                    label: "E · ОСПОРИТЬ ПРЕДСКАЗУЕМОСТЬ ТЕСТА",
                    optional: !0,
                    action: "question"
                })
            }
        }
        if (t.button && (!t.presentation.device || t.presentation.device === "button")) {
            const p = Re(s, t),
                O = t.kind === "prohibition" || t.kind === "repeat-inhibition",
                v = it(t),
                z = v / .5,
                F = t.presentation.buttonStyle === "amber" ? "#875421" : t.presentation.buttonStyle === "ivory" ? "#9b9d85" : "#7c3028",
                G = t.presentation.buttonStyle === "amber" ? "#d18a32" : t.presentation.buttonStyle === "ivory" ? "#d2d5ae" : "#b73b30";
            this.buttonPoint = {
                ...p
            }, this.box(v, .74, v, p.x, .37, p.z, m), this.collision.add("test-button", p.x, p.z, v, v);
            const $ = this.box(.36 * z, .1, .36 * z, p.x, .79, p.z, g),
                bt = this.box(.24 * z, .12, .24 * z, p.x, .9, p.z, this.solid(F, G, .45));
            this.tag($, {
                id: "test-button",
                context: "buttons",
                label: "E  ·  НАЖАТЬ КНОПКУ",
                optional: O,
                action: "button"
            }), this.tag(bt, {
                id: "test-button",
                context: "buttons",
                label: "E  ·  НАЖАТЬ КНОПКУ",
                optional: O,
                action: "button"
            }), t.presentation.signalMode === "button-lamp" && (this.signalMaterial = this.solid("#314138", "#456b48", .12), this.box(.18, .18, .05, p.x, 1.18, p.z - .28, this.signalMaterial), this.signalPoint = {
                x: p.x,
                y: 1.18,
                z: p.z - .28
            })
        }
        if (t.presentation.signalMode === "door-lamp" && (this.signalPoint = {
                x: 1.35,
                y: 1.34,
                z: -n / 2 + .21
            }), t.presentation.signalMode === "speaker") {
            const p = this.solid("#202b28"),
                O = this.box(.72, .54, .16, 2.15, 2.35, -n / 2 + .02, p);
            this.tag(O, {
                id: "wait-speaker",
                context: "instructions",
                label: "СИГНАЛЬНЫЙ ДИНАМИК",
                optional: !1,
                action: "inspect"
            });
            for (const v of [1.9, 2.15, 2.4])
                for (const z of [2.22, 2.35, 2.48]) this.box(.055, .055, .03, v, z, -n / 2 + .12, E);
            this.signalMaterial = this.solid("#314138", "#6aa56c", .12), this.box(.16, .09, .035, 2.15, 2.02, -n / 2 + .13, this.signalMaterial), this.signalPoint = {
                x: 2.15,
                y: 2.2,
                z: -n / 2 + .2
            }
        }
        this.box(.1, .08, 2.3, o / 2 - .09, 1.36, 0, E), this.box(.1, .08, 2.3, o / 2 - .09, 2.44, 0, E), this.box(.1, 1.16, .08, o / 2 - .09, 1.9, -1.11, E), this.box(.1, 1.16, .08, o / 2 - .09, 1.9, 1.11, E);
        const glassMat = new Ve({
            color: "#17302d",
            transparent: !0,
            opacity: .28,
            depthWrite: !1
        });
        this.materials.push(glassMat);
        const ft = this.box(.025, 1.02, 2.1, o / 2 - .18, 1.9, 0, glassMat);
        this.tag(ft, {
            id: "observation-window",
            context: "observation",
            label: "ОДНОСТОРОННЕЕ СТЕКЛО",
            optional: !0,
            action: "inspect"
        }), this.box(.08, .04, 2, o / 2 - .22, 1.9, 0, g);
        this.previousBay = new W, this.scene.add(this.previousBay);
        const bayX = o / 2 + 1.45;
        this.box(2.7, .12, 2.3, bayX, -.06, 0, l, this.previousBay), this.box(2.7, .12, 2.3, bayX, r + .02, 0, y, this.previousBay), this.box(.12, r, 2.3, o / 2 + 2.8, r / 2, 0, d, this.previousBay), this.box(2.7, r, .12, bayX, r / 2, -1.16, d, this.previousBay), this.box(2.7, r, .12, bayX, r / 2, 1.16, d, this.previousBay);
        const bayLight = new xe("#91aa92", i === 11 ? 5.2 : 1.4, 5, 1.7);
        bayLight.position.set(o / 2 + 1.15, 2.55, 0), this.scene.add(bayLight);
        this.falseObserverProp = new W, this.falseObserverProp.position.set(o / 2 + .75, 0, .15), this.scene.add(this.falseObserverProp), this.box(.28, 1.45, .22, 0, .72, 0, E, this.falseObserverProp), this.box(.52, .12, .25, 0, 1.47, 0, E, this.falseObserverProp), this.box(.12, .7, .12, -.24, .36, .02, E, this.falseObserverProp), this.falseObserverProp.visible = !1;
        this.buildPreviousBay(a, o, n, r, m, g, E);
        if (i >= 4 && ![6, 12, 13].includes(i)) {
            const p = new Ve({
                map: this.assets.sign(["SYSTEM", "STANDBY"], 768, 256, "#9ab7a1", "#08110f"),
                transparent: !0
            });
            this.materials.push(p), this.callbackScreen = new K(new Qe(1.65, .55), p), this.callbackScreen.position.set(o / 2 + .035, 2.62, 0), this.callbackScreen.rotation.y = -Math.PI / 2, this.callbackScreen.visible = !1, this.scene.add(this.callbackScreen)
        }
        if ([4, 7, 12].includes(i)) {
            const v = new Ve({
                map: this.assets.sign(["FORECAST", "PENDING"], 1024, 512, "#b8d3ba", "#07100d"),
                transparent: !1
            }), boardZ = t.soundVariant ? -Math.min(1.95, n / 2 - 1.55) : .15;
            this.materials.push(v), this.predictionScreen = new K(new Qe(2.45, 1.18), v), this.predictionScreen.position.set(-o / 2 + .12, 1.95, boardZ), this.predictionScreen.rotation.y = Math.PI / 2, this.scene.add(this.predictionScreen), this.box(2.62, 1.35, .1, -o / 2 + .06, 1.95, boardZ, m)
        }
        if ([7, 12].includes(i)) {
            const v = this.solid("#020504", "#0a1711", .01);
            this.predictionGhost = new W, this.scene.add(this.predictionGhost), this.box(.28, 1.35, .18, 0, .72, 0, v, this.predictionGhost), this.box(.38, .38, .2, 0, 1.55, 0, v, this.predictionGhost), this.box(.08, .76, .08, -.2, .38, 0, v, this.predictionGhost), this.box(.08, .76, .08, .2, .38, 0, v, this.predictionGhost), this.predictionGhost.visible = !1
        }
        if (i === 13) {
            const p = new Ve({
                map: this.assets.sign(["REACTION RECORD", "PENDING"], 1024, 768, "#c8d7bd", "#07100d")
            });
            this.materials.push(p), this.room13Screen = new K(new Qe(3.5, 2.1), p), this.room13Screen.position.set(0, 1.62, -1.15), this.scene.add(this.room13Screen), this.box(3.72, 2.32, .12, 0, 1.62, -1.24, m)
        }
        const le = new Ve({
            color: "#020504",
            transparent: !0,
            opacity: .9,
            depthWrite: !1
        });
        this.materials.push(le), this.windowShadow.position.set(o / 2 - .215, 0, 0), this.windowShadow.rotation.y = -Math.PI / 2, this.scene.add(this.windowShadow), this.box(.3, 1.08, .035, 0, 1.55, 0, le, this.windowShadow), this.windowShadowHead = this.box(.36, .36, .04, 0, 2.25, 0, le, this.windowShadow);
        for (const p of [-.22, .22]) this.box(.065, 1.35, .035, p, 1.45, 0, le, this.windowShadow);
        this.windowShadow.visible = !1, this.windowShadow.traverse(p => p.layers.mask = 0), this.cameraHead = new W, this.cameraHead.position.set(o / 2 - .5, 2.85, -n / 2 + .8), this.scene.add(this.cameraHead), this.box(.18, .25, .22, 0, .1, -.05, g, this.cameraHead);
        const mt = this.box(.3, .22, .5, 0, 0, .2, m, this.cameraHead);
        this.tag(mt, {
            id: "camera",
            context: "cameras",
            label: "КАМЕРА НАБЛЮДЕНИЯ",
            optional: !0,
            action: "inspect"
        }), this.box(.14, .13, .04, 0, 0, .47, E, this.cameraHead), this.cameraLedMaterial = this.solid("#8a241f", "#dd3922", 2), this.box(.035, .025, .04, .1, .07, .47, this.cameraLedMaterial, this.cameraHead);
        for (const p of s.props) {
            const O = new W;
            O.position.set(p.x, 0, p.z), this.scene.add(O), this.tag(O, {
                id: p.id,
                context: "unknownObjects",
                label: "E · ОТКРЫТЬ / ЗАКРЫТЬ ШКАФ",
                optional: !0,
                action: "cabinet"
            });
            const v = [new ne(p.width, 1.35, .08).translate(0, .675, -p.depth / 2 + .04)];
            for (const $ of [-p.width / 2 + .035, p.width / 2 - .035]) v.push(new ne(.07, 1.35, p.depth).translate($, .675, 0));
            for (const $ of [.04, 1.31]) v.push(new ne(p.width, .08, p.depth).translate(0, $, 0));
            const z = new K(Ye(v), m);
            z.castShadow = !0, z.receiveShadow = !0, O.add(z), v.forEach($ => $.dispose());
            const F = this.box(p.width - .08, 1.21, .05, 0, .675, p.depth / 2, m, O),
                G = this.sign(["INTERNAL", "MEMORANDUM"], p.width * .6, .42, 0, .85, p.depth / 2 - .12, "#29352d", "#c5c2a5", O);
            this.tag(G, {
                id: `document:${p.id}`,
                cabinetId: p.id,
                context: "documents",
                label: "E · ПРОЧИТАТЬ ДОКУМЕНТ",
                optional: !0,
                action: "document"
            }), G.visible = !1, G.layers.mask = 0, this.cabinets.set(p.id, {
                root: O,
                door: F,
                document: G,
                target: !1,
                open: 0
            }), p.solid && this.collision.add(p.id, p.x, p.z, p.width, p.depth)
        }
        if (t.soundVariant)
            for (const [p, O] of Ae(s, i).entries()) {
                const v = new W;
                v.position.set(O.x, 0, O.z), this.scene.add(v), this.tag(v, {
                    id: O.id,
                    context: "sound",
                    label: "E · ПРОВЕРИТЬ ПЕРЕДАТЧИК",
                    optional: !1,
                    action: "source"
                }), this.box(.4, .8, .4, 0, .4, 0, m, v), this.box(.36, .5, .3, 0, 1.05, 0, g, v);
                const z = [.93, 1, 1.07].map($ => new ne(.28, .025, .02).translate(0, $, .16)),
                    F = new K(Ye(z), E);
                v.add(F), z.forEach($ => $.dispose());
                const G = this.solid("#556a48", "#abc16c", .06);
                this.sourceLamps.push(G), this.box(.12, .065, .03, 0, 1.23, .17, G, v), this.collision.add(O.id, O.x, O.z, .4, .4), p === t.soundVariant.sourceIndex && (this.sourcePoint = {
                    x: O.x,
                    y: 1.25,
                    z: O.z
                })
            }
        this.box(2.8, .2, 3.4, 0, -.1, -n / 2 - 1.7, l), this.box(2.8, .18, 3.4, 0, r + .09, -n / 2 - 1.7, y), this.wall(.2, r, 3.4, -1.5, r / 2, -n / 2 - 1.7, d), this.wall(.2, r, 3.4, 1.5, r / 2, -n / 2 - 1.7, d), this.wall(2.8, r, .2, 0, r / 2, -n / 2 - 3.4, d), this.sign(i === 13 ? ["OCCUPANCY", "01"] : ["END OF", `TEST ${c}`], 1.8, .7, 0, 1.8, -n / 2 - 3.28, "#aab9ac", "#1b2a25"), this.scene.add(new It(u === "degraded" ? "#c3ae87" : "#b0c6ac", u === "degraded" ? "#3b2c21" : "#263c32", u === "surveillance" ? .32 : .45)), this.fixtureMaterial = this.solid("#b9c7ae", "#d5e6ae", 3);
        for (const p of [-2, 2]) this.box(1.9, .12, .36, 0, r - .09, p, m), this.box(1.65, .035, .2, 0, r - .17, p, this.fixtureMaterial);
        this.spot = new Ze(u === "degraded" ? "#e5c28f" : "#dfedc5", u === "surveillance" ? 62 : 75, 18, .95, .55, 1.6), this.spot.position.set(0, r - .22, -1.6), this.spot.target.position.set(0, 0, -1), this.spot.castShadow = !0, this.spot.shadow.mapSize.set(1024, 1024), this.spot.shadow.bias = -5e-4, this.spot.shadow.normalBias = .03, this.scene.add(this.spot, this.spot.target), this.point = new xe("#b8d6bd", 14, 10, 1.7), this.point.position.set(0, r - .4, 2.5), this.scene.add(this.point), this.emergency = new xe("#ed4022", 0, 8, 1.5), this.emergency.position.set(1.3, 2.6, -n / 2 + .3), this.scene.add(this.emergency), this.box(.5, .13, .16, 1.3, 2.6, -n / 2 + .12, this.solid("#8e4b22", "#bc5b25", 1));
        const He = new xe("#80b2ad", 15, 7, 1.4);
        He.position.set(0, 2.8, -n / 2 - 2.4), this.scene.add(He);
        const gt = this.box(.32, .44, .14, -o / 2 + .14, 1.3, 2, m);
        if (this.tag(gt, {
                id: "light-relay",
                context: "buttons",
                label: "E  ·  АВАРИЙНЫЙ СВЕТ",
                optional: !0,
                action: "light"
            }), i >= 5) {
            const p = this.solid("#171714");
            for (let O = 0; O < Math.min(5, i - 3); O++) this.box(.09, .006, .31, -.42 + O * .19, .008, 1.45 + O * .42, p).rotation.y = O % 2 ? -.32 : .28
        }
        i === 11 && this.sign(["ROOM LABEL", "NOT UPDATED"], 1.25, .34, 1.8, .6, n / 2 - .015, "#8f8f7d", "#2b2925")
    }
    definition;
    experiment;
    roomIndex;
    scene = new Je;
    collision = new bi;
    assets = new wi;
    door;
    doorCollider;
    spot;
    emergency;
    fixtureMaterial;
    point;
    cameraHead;
    cameraLedMaterial;
    windowShadowHead;
    memoryEchoBase;
    memoryEchoAnomaly;
    callbackScreen;
    predictionScreen;
    room13Screen;
    previousBay;
    previousBayProps = [];
    previousBayDoor;
    previousBayCamera;
    previousBayObserver;
    previousBaySnapshot;
    falseObserverProp;
    predictionGhost;
    predictionGhostSpawned = !1;
    predictionGhostMode = "waiting";
    materials = [];
    signalMaterial;
    doorSignalMaterial;
    buttonPoint;
    signalPoint;
    rewardMesh;
    observer = new W;
    observerHead = new W;
    observerLimbs = [];
    observerFace;
    windowShadow = new W;
    buildPreviousBay(e, t, i, s, o, n, r) {
        if (!e || this.roomIndex !== 11) return;
        this.previousBaySnapshot = e;
        const c = this.definition.size.width / 2,
            u = c + 2.65;
        this.previousBayDoor = this.box(.10, 2.15, .92, u, 1.075 + (e.doorOpen ?? 0) * 2.15, 0, o, this.previousBay);
        const d = this.solid("#27372f", "#5a6f5c", .12);
        for (const l of e.props ?? []) {
            const y = Math.max(-.75, Math.min(.75, (l.x / (e.size?.width || 8)) * 1.6)),
                m = c + .75 + Math.max(0, Math.min(1.4, ((-l.z + (e.size?.depth || 10) / 2) / (e.size?.depth || 10)) * 1.4)),
                g = this.box(Math.max(.18, Math.min(.48, l.depth * .22)), .82, Math.max(.18, Math.min(.52, l.width * .22)), m, .41, y, d, this.previousBay);
            g.userData.wasOpen = !!l.open, l.open && (g.position.y = .68), this.previousBayProps.push(g)
        }
        this.previousBayCamera = new W, this.previousBayCamera.position.set(c + 2.45, 2.25, -.72), this.scene.add(this.previousBayCamera), this.box(.18, .18, .28, 0, 0, 0, n, this.previousBayCamera), this.previousBayCamera.rotation.y = Number.isFinite(e.cameraYaw) ? e.cameraYaw : 0;
        const y = c + .75 + Math.max(0, Math.min(1.4, ((-(e.player?.z ?? 0) + (e.size?.depth || 10) / 2) / (e.size?.depth || 10)) * 1.4)),
            m = Math.max(-.75, Math.min(.75, (e.player?.x ?? 0) / (e.size?.width || 8) * 1.6));
        this.previousBayObserver = new W, this.previousBayObserver.position.set(y, 0, m), this.previousBayObserver.rotation.y = -(e.player?.yaw ?? 0) + Math.PI / 2, this.scene.add(this.previousBayObserver), this.box(.22, 1.25, .15, 0, .63, 0, r, this.previousBayObserver), this.box(.28, .28, .17, 0, 1.42, 0, r, this.previousBayObserver), this.previousBayObserver.visible = !1;
        const g = this.solid(e.blackout ? "#171a17" : e.emergency ? "#6f241b" : e.signal ? "#456b48" : "#29352f", e.blackout ? "#000000" : e.emergency ? "#e5472c" : e.signal ? "#a6d27c" : "#52645b", e.blackout ? .01 : e.emergency ? 2.8 : e.signal ? 2.2 : .15);
        this.box(.14, .09, .05, c + 2.48, 1.82, .65, g, this.previousBay), this.sign([String(e.roomIndex ?? 10).padStart(3, "0"), e.presentation?.mood?.toUpperCase?.() ?? "ARCHIVED"], .72, .34, c + 1.1, 2.3, -.98, "#9aab98", "#14211b", this.previousBay)
    }
    applyPreviousRoomMutation() {
        if (this.roomIndex !== 11 || !this.previousBaySnapshot) return !1;
        const e = this.previousBayProps[0];
        e && (e.position.z += e.position.z > 0 ? -.28 : .28, e.position.y = e.userData.wasOpen ? .41 : .68), this.previousBayDoor && (this.previousBayDoor.position.y = 3.225), this.previousBayCamera && (this.previousBayCamera.rotation.y += .9), this.previousBayObserver && (this.previousBayObserver.visible = !0);
        return !0
    }
    setSystemCallback(e) {
        if (!this.callbackScreen) return;
        this.callbackScreen.visible = !!e;
        if (e) this.callbackScreen.material.map = this.assets.sign(["SYSTEM", e], 768, 256, "#d6b58c", "#130b08"), this.callbackScreen.material.needsUpdate = !0
    }
    setPredictionBoard(e, t = null, s = 0, o = 0) {
        if (!this.predictionScreen) return;
        const i = [];
        e && (i.push(e.counter ? "MODEL CORRECTION / ROOM SELECTED" : "FORECAST / ROOM SELECTED"), i.push(e.expected ?? "FOLLOW THE PROCEDURE"), i.push(`BASIS: ${e.trait ?? "CALIBRATION"}`), e.tentative && i.push("CONFIDENCE: TENTATIVE")), t && (i.length = 0, i.push(t.status === "confirmed" ? "PREDICTION CONFIRMED" : "PREDICTION FAILED"), i.push(`LAST: ${t.expected ?? "MODEL RESPONSE RECORDED"}`), i.push(t.status === "failed" ? `MODEL INSTABILITY: ${s}/3` : `REPLICATION INTEGRITY: ${o}/3`), e && i.push(`${e.counter ? "COUNTERTEST" : "NEXT"}: ${e.expected ?? "FOLLOW THE PROCEDURE"}`)), this.predictionScreen.material.map = this.assets.sign(i.length ? i : ["FORECAST", "STANDBY"], 1024, 512, t?.status === "failed" ? "#d6a58d" : "#b8d3ba", "#07100d"), this.predictionScreen.material.needsUpdate = !0
    }
    syncPrediction(e, t, i, s = [], o = {}) {
        if (!this.predictionGhost || !t) return;
        if (e.phase !== "baseline") {
            this.predictionGhost.visible = !1;
            return
        }
        const n = Number(o.breaks) || 0,
            r = Number(o.confirmations) || 0,
            c = Math.max(2.6, 4.8 - r * .65 + n * .25),
            u = Math.max(6.8, Math.min(10, 9 - r * .65 + n * .4)),
            d = n > r && Math.floor(e.age * 10) % 4 === 0;
        this.predictionGhost.scale.setScalar(r > n ? 1.08 : 1);
        if (s.length >= 2 && e.age >= c && (this.roomIndex === 7 || e.age < u)) {
            const l = s[0].at,
                y = Math.max(.1, s.at(-1).at - l),
                m = l + Math.min(y, (e.age - c) * (this.roomIndex === 12 ? 1.4 : 1)),
                g = s.findLast(a => a.at <= m) ?? s[0],
                v = this.definition.size;
            this.predictionGhost.position.set(g.x * Math.max(1, v.width / 2 - .7), 0, g.z * Math.max(1, v.depth / 2 - .7)), this.predictionGhost.rotation.y = g.yaw, this.predictionGhost.visible = !d, this.predictionGhostSpawned = !0, this.predictionGhostMode = "replay";
            return
        }
        if (this.roomIndex === 12 && n >= 2 && e.age >= u) {
            this.predictionGhost.visible = !d, this.predictionGhost.position.x += Math.sin(e.age * 13) * .018, this.predictionGhost.position.z += Math.cos(e.age * 11) * .018, this.predictionGhostMode = "unstable";
            return
        }
        if (e.age >= (this.roomIndex === 12 ? u : c) && this.predictionGhostMode !== "intercept") {
            const l = 3.1,
                y = i.x - Math.sin(i.yaw) * l,
                m = i.z - Math.cos(i.yaw) * l;
            this.predictionGhost.position.set(y, 0, m), this.predictionGhost.rotation.y = i.yaw, this.predictionGhost.visible = !0, this.predictionGhostSpawned = !0, this.predictionGhostMode = "intercept"
        } else this.predictionGhostMode === "intercept" && this.predictionGhost.visible && Math.hypot(i.x - this.predictionGhost.position.x, i.z - this.predictionGhost.position.z) < .85 && (this.predictionGhost.visible = !1)
    }
    setReactionReport(e) {
        if (!this.room13Screen || !Array.isArray(e) || !e.length) return;
        this.room13Screen.material.map = this.assets.sign(e, 1024, 768, "#c8d7bd", "#07100d"), this.room13Screen.material.needsUpdate = !0
    }
    syncThreat(e, t) {
        const i = ["hunt_reveal", "hunt", "search", "caught"].includes(e.phase),
            s = e.windowObserver ?? {
                visible: !1,
                z: e.plan.cueZ,
                scale: 1,
                kind: "none",
                lookBehind: !1
            },
            o = e.phase === "blackout_observer" && e.phaseDuration > 0 ? e.phaseTime / e.phaseDuration : 1,
            n = s.visible && (e.phase !== "blackout_observer" || o > .58),
            r = n && s.kind !== "false",
            c = n && s.kind === "false";
        this.observer.visible = i, this.observer.traverse(a => a.layers.mask = i ? 1 : 0), this.windowShadow.visible = r, this.windowShadow.traverse(a => a.layers.mask = r ? 1 : 0), this.falseObserverProp && (this.falseObserverProp.visible = c, this.falseObserverProp.traverse(a => a.layers.mask = c ? 1 : 0)), this.windowShadow.position.x = this.definition.size.width / 2 + (s.depth ?? 1.45), this.windowShadow.position.z = s.z ?? e.plan.cueZ, this.windowShadow.scale.set(s.scale ?? 1, s.scale ?? 1, 1);
        if (this.windowShadowHead) {
            this.windowShadowHead.rotation.set(0, 0, 0);
            if (s.lookBehind) {
                const a = s.lookBehindX ?? t.x + Math.sin(t.yaw) * 2.2,
                    l = s.lookBehindZ ?? t.z + Math.cos(t.yaw) * 2.2;
                this.windowShadowHead.lookAt(a, 1.65, l)
            }
        }
        this.observer.position.set(e.x, 0, e.z), this.observer.rotation.y = Math.atan2(t.x - e.x, t.z - e.z);
        const u = e.phase === "hunt" || e.phase === "search";
        this.observerHead.rotation.z = Math.sin(e.age * .73) * .028, this.observerLimbs.forEach((a, l) => a.rotation.x = u ? Math.sin(e.age * 5.2 + l * Math.PI) * .12 : 0), this.observerFace && (this.observerFace.visible = e.phase === "caught" || e.phase === "hunt" && Math.hypot(t.x - e.x, t.z - e.z) < 2.4);
        if (["camera", "camera_reposition"].includes(e.phase)) {
            const a = e.cameraStartYaw ?? e.cameraYaw,
                l = e.cameraTargetYaw ?? e.cameraYaw,
                y = Mt.clamp(e.phaseTime / Math.max(.001, e.phaseDuration), 0, 1),
                m = y * y * (3 - 2 * y),
                g = Math.atan2(Math.sin(l - a), Math.cos(l - a));
            this.cameraHead.rotation.y = a + g * m
        } else this.cameraHead.rotation.y = e.cameraYaw;
        this.cameraLedMaterial && (this.cameraLedMaterial.emissiveIntensity = e.phase === "camera_led" ? 5.5 : 2);
        if (e.phase === "lightdip") {
            this.spot.intensity *= .48, this.point.intensity *= .56, this.fixtureMaterial.emissiveIntensity *= .45
        }
        if (e.phase === "stutter") {
            const a = this.reducedFlicker ? .55 : Math.floor(e.phaseTime * 13) % 3 === 0 ? .12 : 1;
            this.spot.intensity *= a, this.point.intensity *= a, this.fixtureMaterial.emissiveIntensity *= a
        }
        if (e.phase === "fixture_off") {
            this.point.intensity *= .12, this.fixtureMaterial.emissiveIntensity *= .18
        }
        if (e.phase === "sector_failure") {
            this.spot.intensity *= .3, this.point.intensity *= .12, this.fixtureMaterial.emissiveIntensity *= .2, this.emergency.intensity = Math.max(this.emergency.intensity, 1.1)
        }
        if (["blackout", "blackout_prop", "blackout_observer", "hunt_blackout"].includes(e.phase)) {
            const a = e.phase === "blackout_observer" && o > .58 ? .5 : .025;
            this.spot.intensity *= a, this.point.intensity *= a * .5, this.fixtureMaterial.emissiveIntensity *= a, this.emergency.intensity = 0
        }
        if (e.phase === "hunt_reveal") {
            this.spot.intensity *= .86, this.point.intensity *= .78, this.fixtureMaterial.emissiveIntensity *= .82
        }
        if (e.phase === "door_relock" && this.doorSignalMaterial) this.doorSignalMaterial.emissiveIntensity = .01;
        if (e.phase === "hunt" || e.phase === "search") {
            this.spot.intensity *= .72, this.point.intensity *= .7, this.emergency.intensity = Math.max(this.emergency.intensity, 2.2)
        }
    }
    applyHorrorProp(e) {
        if (e === "previous_room_mutation") return this.applyPreviousRoomMutation();
        const t = [...this.cabinets.values()][0];
        if (!t) return !1;
        if (e === "prop_rotate") t.root.rotation.y += (this.roomIndex % 2 ? .14 : -.14);
        else if (e === "prop") t.root.position.x += this.roomIndex % 2 ? .13 : -.13;
        else if (e === "cabinet_open" || e === "blackout_prop") t.target = !0;
        return !0
    }
    fuse;
    heldFuse;
    syncPower(e, t) {
        if (!e || !this.fuse || !this.heldFuse) return;
        const i = e.location === "hand";
        this.fuse.visible = !i, this.fuse.traverse(r => r.layers.mask = i ? 0 : 1), this.heldFuse.visible = i, this.heldFuse.traverse(r => r.layers.mask = i ? 1 : 0);
        const s = Ie(this.definition),
            o = e.location === "floor" ? e.floor : e.location === "a" ? s.a : e.location === "b" ? s.b : s.stand;
        this.fuse.position.set(o.x, e.location === "floor" ? .14 : e.location === "a" || e.location === "b" ? 1.12 : .94, o.z + (e.location === "a" || e.location === "b" ? .3 : 0));
        const n = e.location === "a" ? "socket-a" : e.location === "b" ? "socket-b" : "take-fuse";
        this.tag(this.fuse, {
            id: "fuse",
            context: "tools",
            optional: !1,
            action: "power",
            powerAction: n,
            label: n === "take-fuse" ? "E · ВЗЯТЬ ПРЕДОХРАНИТЕЛЬ" : "E · ИЗВЛЕЧЬ ПРЕДОХРАНИТЕЛЬ"
        }), this.heldFuse.position.copy(new Rt(.28, -.28, -.6).applyMatrix4(t.matrixWorld)), this.heldFuse.quaternion.copy(t.quaternion)
    }
    cabinets = new Map;
    sourceLamps = [];
    sourcePoint;
    sourcePulse = !1;
    syncObjects(e, t = !1) {
        this.rewardMesh && (this.rewardMesh.visible = !e.collected, this.rewardMesh.layers.mask = e.collected ? 0 : 1);
        for (const [i, s] of this.cabinets) s.target = !!e[ke(i)], t && (s.open = s.target ? 1 : 0)
    }
    open = 0;
    targetOpen = !1;
    emergencyMode = !1;
    blackoutMode = !1;
    signalActive = !1;
    unlockedVisual = !1;
    reducedFlicker = !1;
    time = 0;
    mat(e) {
        const t = new Ee({
            map: this.assets.texture(e),
            roughness: e === "metal" ? .72 : .95,
            metalness: e === "metal" ? .45 : 0
        });
        return this.materials.push(t), t
    }
    solid(e, t = "#000000", i = 0) {
        const s = new Ee({
            color: e,
            emissive: t,
            emissiveIntensity: i,
            roughness: .8
        });
        return this.materials.push(s), s
    }
    box(e, t, i, s, o, n, r, c = this.scene) {
        const u = new ne(e, t, i),
            d = u.attributes.uv;
        if (r instanceof Ee && r.map) {
            const y = r.map === this.assets.texture("wall");
            for (let m = 0; m < d.count; m++) {
                const g = Math.floor(m / 4);
                d.setXY(m, d.getX(m) * (g < 2 ? i : e) / 2, d.getY(m) * (g === 2 || g === 3 ? i : t) / (y ? 3.5 : 2))
            }
        }
        const l = new K(u, r);
        return l.position.set(s, o, n), l.castShadow = !0, l.receiveShadow = !0, c.add(l), l
    }
    wall(e, t, i, s, o, n, r) {
        this.box(e, t, i, s, o, n, r), this.collision.add(`wall-${this.collision.boxes.length}`, s, n, e, i)
    }
    sign(e, t, i, s, o, n, r, c, u = this.scene) {
        const d = new Ve({
            map: this.assets.sign(e, 512, 256, r, c)
        });
        this.materials.push(d);
        const l = new K(new Qe(t, i), d);
        return l.position.set(s, o, n), u.add(l), l
    }
    tag(e, t) {
        e.userData.interactable = t
    }
    update(e, t) {
        for (const o of this.cabinets.values()) {
            o.open = Mt.clamp(o.open + (o.target ? e * 2 : -e * 2), 0, 1), o.door.position.y = .675 + o.open * 1.25;
            const n = o.target && o.open > .9;
            o.document.visible = n, o.document.layers.mask = n ? 1 : 0
        }
        this.sourceLamps.forEach((o, n) => o.emissiveIntensity = this.sourcePulse && n === this.experiment.soundVariant?.sourceIndex ? 4 : .06), this.time += e, this.open = Mt.clamp(this.open + (this.targetOpen ? e / 2 : -e * 1.5), 0, 1), this.door.position.y = this.open * 2.85, this.doorCollider.enabled = this.open < .94;
        const i = 0,
            s = 1;
        if (this.blackoutMode ? (this.spot.intensity = .7, this.point.intensity = .25, this.fixtureMaterial.emissiveIntensity = .03, this.emergency.intensity = 0) : (this.spot.intensity = (this.emergencyMode ? 3 : 75) * s, this.point.intensity = this.emergencyMode ? 1.5 : 14 * s, this.fixtureMaterial.emissiveIntensity = this.emergencyMode ? .2 : 3 * s, this.emergency.intensity = this.emergencyMode ? 20 + 3 * Math.sin(this.time * 2) : 1.2), this.signalMaterial && (this.signalMaterial.emissiveIntensity = this.signalActive ? 3.4 : .12), this.doorSignalMaterial) {
            const o = this.experiment.presentation.signalMode === "door-lamp";
            this.doorSignalMaterial.emissiveIntensity = o ? this.signalActive ? 3.4 : .08 : this.unlockedVisual && this.experiment.presentation.exitCue !== "dark" ? 2.3 : .08
        }
        return !1
    }
    dispose() {
        this.scene.traverse(e => {
            e instanceof K && e.geometry.dispose()
        }), this.spot.shadow.dispose();
        for (const e of this.materials) e.dispose();
        this.assets.dispose(), this.scene.clear()
    }
}
class vi {
    renderer;
    target;
    camera = new zt(72, 1, .05, 50);
    post = new Je;
    ortho = new Nt(-1, 1, 1, -1, 0, 1);
    material;
    resolution = 270;
    draws = 0;
    triangles = 0;
    constructor(e) {
        this.renderer = new At({
            antialias: !1,
            powerPreference: "high-performance"
        }), this.renderer.setPixelRatio(1), this.renderer.shadowMap.enabled = !0, this.renderer.shadowMap.type = Ct, this.renderer.outputColorSpace = Pt, this.renderer.info.autoReset = !1, e.append(this.renderer.domElement), this.target = new Dt(480, 270, {
            minFilter: ge,
            magFilter: ge
        }), this.material = new Lt({
            uniforms: {
                tScene: {
                    value: this.target.texture
                },
                resolution: {
                    value: new Xe(480, 270)
                }
            },
            vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
            fragmentShader: `
      precision highp float;uniform sampler2D tScene;uniform vec2 resolution;varying vec2 vUv;
      float bayer(vec2 p){vec2 a=mod(floor(p),2.);vec2 b=mod(floor(p/2.),2.);float lo=2.*a.x+3.*a.y-4.*a.x*a.y;float hi=2.*b.x+3.*b.y-4.*b.x*b.y;return (4.*lo+hi+.5)/16.-.5;}
      void main(){vec3 color=texture2D(tScene,vUv).rgb; color=color/(color+vec3(.65));color=pow(max(color,vec3(0.)),vec3(1./2.2));
        float d=bayer(vUv*resolution);color=floor(clamp(color+d/60.,0.,1.)*23.+.5)/23.;
        vec2 p=vUv-.5;color*=1.-.35*dot(p,p);gl_FragColor=vec4(color,1.);}`
        }), this.post.add(new K(new Qe(2, 2), this.material)), this.resize(), window.addEventListener("resize", this.resize)
    }
    resize = () => {
        const e = window.innerWidth,
            t = window.innerHeight;
        this.renderer.setSize(e, t), this.camera.aspect = e / t, this.camera.updateProjectionMatrix();
        const i = Math.max(1, Math.round(this.resolution * e / t));
        this.target.setSize(i, this.resolution), this.material.uniforms.resolution.value.set(i, this.resolution)
    };
    render(e) {
        this.renderer.info.reset(), this.renderer.setRenderTarget(this.target), this.renderer.render(e, this.camera), this.renderer.setRenderTarget(null), this.renderer.render(this.post, this.ortho), this.draws = this.renderer.info.render.calls, this.triangles = this.renderer.info.render.triangles
    }
    dispose() {
        window.removeEventListener("resize", this.resize), this.target.dispose(), this.material.dispose(), this.renderer.dispose()
    }
}
class xi {
    constructor(e, t, i, s, o) {
        this.model = t, this.seed = i, this.experiment = s, this.diagnostics = o, this.element = document.createElement("section"), this.element.id = "debug", this.element.hidden = !0, this.element.innerHTML = `<header><span class="eyebrow">OBSERVED / DIAGNOSTICS</span><h2>Behavior laboratory</h2><span class="muted">Симуляция приостановлена · F2 — вернуться</span></header><nav>${["Overview","Context","Patterns","Horror","Events"].map(n=>`<button data-tab="${n}">${n}</button>`).join("")}</nav><div id="debug-body"></div><footer><button id="export-profile">Экспорт профиля и событий</button><span>v0.14.2 MOBILE SUSPENSE · local only</span></footer>`, e.append(this.element), this.element.querySelectorAll("[data-tab]").forEach(n => n.onclick = () => {
            this.tab = n.dataset.tab, this.render()
        }), this.element.querySelector("#export-profile").onclick = () => {
            const n = this.model(),
                r = {
                    version: 1,
                    seed: this.seed(),
                    profile: n.snapshot(),
                    behavior: n.exportState(),
                    director: new ie().chooseProbe(n.snapshot()),
                    session: this.diagnostics?.()
                },
                c = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], {
                    type: "application/json"
                })),
                u = document.createElement("a");
            u.href = c, u.download = "observed-profile.json", u.click(), setTimeout(() => URL.revokeObjectURL(c), 1e3)
        }
    }
    model;
    seed;
    experiment;
    diagnostics;
    visible = !1;
    tab = "Overview";
    element;
    toggle() {
        this.visible = !this.visible, this.element.hidden = !this.visible, this.visible && this.render()
    }
    render() {
        const e = this.model(),
            t = e.snapshot(),
            i = this.element.querySelector("#debug-body");
        this.element.querySelectorAll("[data-tab]").forEach(o => o.classList.toggle("selected", o.dataset.tab === this.tab)), i.replaceChildren();
        const s = (o, n) => {
            const r = document.createElement(o);
            return r.textContent = n, i.append(r), r
        };
        if (this.tab === "Overview") {
            s("p", "Значения — игровые гипотезы. Confidence отражает объём evidence, а не психологическую точность.");
            const o = document.createElement("table");
            o.innerHTML = "<thead><tr><th>Trait</th><th>Effective</th><th>Recent</th><th>Mid</th><th>Lifetime</th><th>Confidence</th><th>n</th><th>Trend</th></tr></thead>";
            const n = document.createElement("tbody");
            for (const [r, c] of Object.entries(t.traits)) {
                const u = document.createElement("tr");
                for (const d of [r, ...[c.effective, c.recent, c.mid, c.lifetime, c.confidence].map(l => l.toFixed(2)), String(c.sampleCount), (c.trend >= 0 ? "+" : "") + c.trend.toFixed(2)]) {
                    const l = document.createElement("td");
                    l.textContent = d, u.append(l)
                }
                n.append(u)
            }
            if (o.append(n), i.append(o), this.experiment) {
                const r = this.experiment();
                s("h3", "Current experiment"), s("pre", JSON.stringify({
                    kind: r.kind,
                    spatialArchetype: r.archetype,
                    timeout: r.timeout,
                    presentation: r.presentation,
                    waitVariant: r.waitVariant,
                    prohibitionVariant: r.prohibitionVariant
                }, null, 2))
            }
            s("h3", "Campaign / current state"), s("pre", JSON.stringify(this.diagnostics?.(), null, 2)), s("h3", "Director handoff"), s("pre", JSON.stringify(new ie().chooseProbe(t), null, 2))
        } else if (this.tab === "Context") {
            const o = document.createElement("select");
            for (const r of Object.keys(t.contexts)) {
                const c = document.createElement("option");
                c.textContent = r, o.append(c)
            }
            i.append(o);
            const n = s("pre", "");
            o.onchange = () => {
                n.textContent = Object.entries(t.contexts[o.value]).map(([r, c]) => `${r.padEnd(24)} ${c.effective.toFixed(2)}  confidence ${c.confidence.toFixed(2)}  n=${c.sampleCount}`).join(`
`)
            }, o.dispatchEvent(new Event("change")), s("h3", "Contextual features"), s("pre", JSON.stringify(t.features, null, 2)), s("h3", "Opportunities"), s("pre", JSON.stringify(e.opportunities, null, 2))
        } else if (this.tab === "Patterns") {
            s("h3", "Derived patterns"), s("pre", t.patterns.length ? JSON.stringify(t.patterns, null, 2) : "Недостаточно независимых наблюдений. Паттерны пока не определены."), s("h3", "Prediction · doors"), s("pre", JSON.stringify({
                prediction: e.predict({
                    context: "doors",
                    instruction: "do"
                }),
                metrics: t.predictions
            }, null, 2));
            const o = new ie().choose(t);
            s("h3", "Director → Generator"), s("pre", JSON.stringify({
                decision: o,
                nextRoom: new tt().generate(`${this.seed()}-next`, o.archetype)
            }, null, 2))
        } else if (this.tab === "Horror") {
            const o = this.diagnostics?.() ?? {};
            s("h3", "Horror Director 0.12"), s("pre", JSON.stringify({
                room: o.threat?.roomIndex,
                tension: o.threat?.tension,
                recentPeak: o.threat?.recentPeak,
                recoveryUntil: o.threat?.recoveryUntil,
                budget: o.threat?.budget,
                spent: o.threat?.spent,
                phase: o.threat?.phase,
                style: o.threat?.style,
                lastDecision: o.threat?.lastDecision,
                rejected: o.threat?.rejected,
                history: o.threat?.history,
                observer: o.threat?.windowObserver,
                schedule: o.threat?.plan?.schedule,
                behaviorOpportunities: o.fear?.opportunityQueue,
                pendingCallbacks: o.fear?.pendingCallbacks,
                previousRoom: o.fear?.previousRoomSnapshot,
                reactions: o.fear
            }, null, 2))
        } else s("h3", `Последние события (${e.events.length}/200)`), s("pre", e.events.slice().reverse().map(o => `${o.time.toFixed(2).padStart(8)}  ${o.type}  [${o.context}] ${o.target??""}`).join(`
`) || "Нет событий"), s("h3", "Evidence / reasons"), s("pre", e.evidence.slice(-60).reverse().map(o => `${o.trait}: ${o.value.toFixed(2)} × ${o.weight} · ${o.context}
  ${o.reason}`).join(`
`))
    }
}
const ce = document.querySelector("#app");
ce.innerHTML = `<div id="hud"><div id="hud-top"><span id="experiment-id">OBS / EXPERIMENT 001</span><span><i id="record"></i>OBSERVATION ACTIVE</span></div><div id="system-message"></div><div id="crosshair"></div><div id="prompt"></div><div id="hint">WASD · МЫШЬ · E ВЗАИМОДЕЙСТВИЕ · F ФОНАРЬ · F2 ПРОФИЛЬ · ESC ПАУЗА</div><div id="stats"></div></div>
<div id="transition" aria-hidden="true"></div>
<section id="menu"><span class="eyebrow">DEPARTMENT OF BEHAVIORAL SYSTEMS</span><h1>OBSERVED</h1><span class="eyebrow">ENGINE 0.14.2 / MOBILE SUSPENSE</span><div class="bar"></div><p class="intro">Тринадцать помещений. Один активный пропуск.<br>Следуйте указаниям внутри комплекса.</p><div class="controls"><b>W A S D</b><span>Движение · Shift — быстрее</span><b>C</b><span>Присесть · двигаться тише</span><b>МЫШЬ / ↑↓←→</b><span>Осмотреться</span><b>E / F</b><span>Взаимодействовать / фонарь</span><b>F2 / Esc</b><span>Профиль поведения / пауза</span></div><div class="menu-buttons"><button id="enter">ВОЙТИ В КОМНАТУ →</button><button id="save" class="secondary">СОХРАНИТЬ</button><button id="load" class="secondary">ЗАГРУЗИТЬ</button></div><div id="seed-row"><label for="seed">SEED</label><input id="seed" type="text" maxlength="128" value="OBSERVED-001" spellcheck="false"><button id="new" class="secondary">НОВЫЙ ТЕСТ</button></div><div class="settings"><label><input id="mute" type="checkbox">Без звука</label><label><input id="flicker" type="checkbox">Меньше мерцания</label><label><input id="invert" type="checkbox">Инверсия Y</label><label>Рендер <select id="resolution"><option value="180">180p</option><option selected value="270">270p</option><option value="360">360p</option></select></label></div><p id="menu-status" role="status"></p><span id="build-tag">MOBILE SUSPENSE · 0.14.2</span></section>
<section id="complete" hidden><article><span class="eyebrow">IDENTITY DISPOSITION</span><h2 id="completion-title">Последовательность завершена.</h2><p id="completion-copy">Результат модели рассчитан.</p><pre id="handoff"></pre><button id="review">ИССЛЕДОВАТЬ ПРОФИЛЬ · F2</button><button id="back-menu" class="secondary">МЕНЮ</button></article></section>`;
const f = a => document.getElementById(a);
ce.insertAdjacentHTML("beforeend", '<div id="dread" aria-hidden="true"></div><section id="caught" hidden><article><span class="eyebrow">RECORDING INTERRUPTED</span><h2>В комнате было двое.</h2><p>Система сохранила только одну запись.</p><button id="retry">ВОССТАНОВИТЬ ЗАПИСЬ КОМНАТЫ</button></article></section>');
ce.insertAdjacentHTML("beforeend", '<section id="document-view" hidden role="dialog" aria-modal="true" aria-labelledby="document-title"><article><span class="eyebrow">DEPARTMENT / INTERNAL RECORD</span><h2 id="document-title"></h2><p id="document-text"></p><button id="document-close">ЗАКРЫТЬ И ПРОДОЛЖИТЬ</button><p class="muted">Чтение приостанавливает испытание · Esc — меню</p></article></section>');
let A;
try {
    A = new vi(ce)
} catch (a) {
    throw f("menu-status").textContent = `WebGL2 недоступен. Включите аппаратное ускорение и откройте в Chrome/Edge. ${String(a)}`, a
}
const C = new Ht(A.renderer.domElement),
    T = new Wt,
    Pe = new te;
let h, w, X, b, re, Z = "OBSERVED-001",
    De = !1,
    ue = 0,
    pe = 0,
    ze = !1,
    J = !1,
    Q = !1,
    ae = "",
    _ = 0,
    fe = "",
    nt, H = null,
    me = 0;
const U = new Ze("#cedbb8", 16, 12, .48, .7, 1.6);
U.visible = !1;
A.camera.add(U);
U.position.set(.12, -.1, 0);
U.target.position.set(0, 0, -4);
A.camera.add(U.target);
const se = new xi(ce, () => h.model, () => Z, () => h.runtime.definition, () => ({
        campaign: h.campaign.state,
        experiment: h.runtime.state,
        threat: h.threat,
        fear: h.fear,
        deaths: h.deaths,
        report: h.campaign.report()
    })),
    j = new $t(a => X.update(a), a => Ti(a));

function ot(a) {
    if (f("caught").hidden = !0, f("dread").style.opacity = "0", T.stopRoomVoices(), f("document-view").hidden = !0, X?.dispose(), w = new yi(h.campaign.room(), h.runtime.definition, h.campaign.state.index, h.fear.previousRoomSnapshot, h.predictionBrief()), X = new Ft, X.onDispose(() => w.dispose()), b = new Ut(C, w.collision), re = new Bt, Object.assign(b, a?.player ?? w.definition.spawn), b.invertY = f("invert").checked, J = a?.emergency ?? !1, w.reducedFlicker = f("flicker").checked, w.scene.add(A.camera), w.open = a?.doorOpen ?? 0, w.targetOpen = a?.doorTarget ?? !1, U.visible = a?.flashlight ?? U.visible, w.emergencyMode = J || !!h.runtime.state.flags.emergency, w.blackoutMode = !!h.runtime.state.flags.blackout, w.signalActive = !!h.runtime.state.flags.signal, w.unlockedVisual = h.runtime.unlocked && (h.campaign.state.index !== 13 || h.fear.reportComplete), w.syncObjects(h.runtime.state.flags, !0), ue = 0, pe = 0, ae = "", _ = 0, ze = !1, fe = "", T.occlusion = (e, t) => w.collision.occlusion(e, t), T.setRoomAcoustics(w.definition.size.width, w.definition.size.depth, h.campaign.state.index, Z), X.add(new Ge("player").set("transform", b).set("controller", b)), X.add(new Ge("door").set("collider", w.doorCollider).set("interactable", {
            action: "door"
        })), X.system(Si), w.update(0, b), Ne(), w.scene.updateMatrixWorld(!0), w.syncPower(h.runtime.state.power, A.camera), nt = new gi(h.threat, w.definition), me = 0, w.syncThreat(h.threat, b), w.setSystemCallback(h.fear.activeSystemText), w.setPredictionBoard(h.predictionBrief(), h.fear.predictionOutcome, h.fear.modelBreaks, h.fear.modelConfirmations), w.collision.blocked(b.x, b.z) && Object.assign(b, w.definition.spawn), f("experiment-id").textContent = `OBS / EXPERIMENT ${String(h.campaign.state.index).padStart(3,"0")}`, f("system-message").textContent = "", f("complete").hidden = !0, !a) {
        H = Fe();
        try {
            Pe.save(H, !0)
        } catch {}
    }
}

function ye(a, e) {
    H = null, Z = a, h = new st(Z, e?.session), ot(e), H || (H = Fe(), H.session.threat = Me(w.definition, h.campaign.state.index, h.threat.style, Z), H.player = {
        ...w.definition.spawn,
        pitch: 0
    }, H.doorOpen = 0, H.doorTarget = !1), f("seed").value = Z
}

function Ne() {
    A.camera.position.set(b.x, b.y, b.z), A.camera.rotation.set(b.pitch, b.yaw, 0, "YXZ"), A.camera.updateMatrixWorld()
}

function Ei() {
    w.targetOpen || (w.targetOpen = !0, T.play("relay", {
        x: 1.3,
        y: 1.3,
        z: w.definition.door.z
    }), T.play("door", {
        x: 0,
        y: 1,
        z: w.definition.door.z
    }))
}

function Oi() {
    if (Q) return;
    Q = !0, C.active = !1, C.clear();
    const a = f("transition");
    a.classList.add("active"), window.setTimeout(() => {
        h.capturePreviousRoom(b.x, b.z, b.yaw, w.open);
        if (!h.advance()) {
            const e = h.ending();
            f("completion-title").textContent = e.title, f("completion-copy").textContent = e.copy, f("handoff").textContent = `${e.code}

MODEL CONFIRMATIONS: ${h.fear.modelConfirmations}
MODEL BREAKS: ${h.fear.modelBreaks}

` + h.campaign.report().text.join(`

`) + `

Обнаружений наблюдателем: ${h.deaths}.`, f("complete").hidden = !1, a.classList.remove("active"), Q = !1, q(!1);
            return
        }
        ot(), window.setTimeout(() => {
            a.classList.remove("active"), Q = !1, C.clear(), C.active = !0
        }, 120)
    }, 180)
}

function Si(a) {
    if (Q) return;
    const e = w.signalActive;
    h.tick(a), T.normalityTick(a);
    const t = h.runtime.definition.soundVariant;
    if (t) {
        const S = h.runtime.state.elapsed,
            k = !h.runtime.state.flags.sourceFound;
        w.sourcePulse = k && S % t.interval < .28, k && w.sourcePoint && Math.floor(S / t.interval) > Math.floor((S - a) / t.interval) && T.play("beacon", w.sourcePoint, t.frequency)
    }
    w.emergencyMode = J || !!h.runtime.state.flags.emergency, w.blackoutMode = !!h.runtime.state.flags.blackout, w.signalActive = !!h.runtime.state.flags.signal, w.unlockedVisual = h.runtime.unlocked && h.threat.phase !== "door_relock" && (h.campaign.state.index !== 13 || h.fear.reportComplete), (h.threat.phase === "door_relock" || h.campaign.state.index === 13 && !h.fear.reportComplete) && (w.targetOpen = !1), w.syncObjects(h.runtime.state.flags), !e && w.signalActive && T.play("relay", {
        x: w.signalPoint?.x ?? 0,
        y: w.signalPoint?.y ?? 1.5,
        z: w.signalPoint?.z ?? w.definition.door.z
    });
    const i = b.update(a);
    h.recordRoute(b.x, b.z, b.yaw);
    ue += i, pe += a, ue > .95 && (ue = 0, T.play("step", {
        x: b.x,
        y: .12,
        z: b.z
    })), pe > 1 && i > .001 && (h.observe({
        type: "PLAYER_MOVED",
        context: "navigation",
        data: {
            distance: b.distance
        }
    }), pe = 0);
    const s = `${Math.floor((b.x+w.definition.size.width/2)/2)}:${Math.floor((b.z+w.definition.size.depth/2)/2)}`;
    h.horrorZone(s), h.zones.has(s) || (h.zones.add(s), h.observe({
        type: "ENTERED_ZONE",
        context: "navigation",
        target: s
    }));
    const o = w.update(a, b);
    o && !ze && T.play("relay", {
        x: 0,
        y: 3.2,
        z: -2
    }), ze = o, Ne(), w.scene.updateMatrixWorld(!0);
    const n = re.update(A.camera, w.scene);
    if (w.syncPower(h.runtime.state.power, A.camera), n?.id !== ae && (ae && _ > .3 && (h.observe({
            type: "LOOKED_AWAY",
            context: "observation",
            target: ae,
            duration: _
        }), h.horrorLookAway(ae, b.yaw)), ae = n?.id ?? "", _ = 0, n?.id && h.horrorLookAt(n.id)), n && (_ += a, _ >= 2 && !h.inspected.has(n.id) && h.inspect(n.id, n.context, n.optional, _)), h.horrorPerception(n?.id ?? "", a, b.yaw), C.take("KeyF") && (U.visible = !U.visible, T.play("relay", {
            x: b.x,
            y: 1.4,
            z: b.z
        })), C.take("KeyG") && h.runtime.state.power?.location === "hand") {
        const S = {
            x: b.x - Math.sin(b.yaw) * .65,
            z: b.z - Math.cos(b.yaw) * .65
        };
        w.collision.occlusion(b, S) > 0 ? h.runtime.state.notice = "Предмет нельзя положить за препятствием." : h.usePower("drop-fuse", S)
    }
    const r = C.take("KeyE") && re.actionable && !!n;
    if (r && n) {
        T.play("inspect", {
            x: b.x,
            y: 1.5,
            z: b.z
        });
        if (n.action === "door") {
            h.interact(n.id, n.context, "door");
            const S = h.threat.phase === "door_relock" || h.campaign.state.index === 13 && !h.fear.reportComplete;
            S ? (w.targetOpen = !1, h.runtime.state.notice = h.campaign.state.index === 13 ? "REACTION RECORD INCOMPLETE." : "ACCESS RELAY CYCLING.", T.play("relay", {
                x: 1.3,
                y: 1.3,
                z: w.definition.door.z
            })) : h.runtime.unlocked ? Ei() : T.play("relay", {
                x: 1.3,
                y: 1.3,
                z: w.definition.door.z
            })
        } else if (n.action === "button" || n.action === "question") h.interact(n.id, n.context, n.action), T.play("relay", {
            x: w.buttonPoint?.x ?? b.x,
            y: 1,
            z: w.buttonPoint?.z ?? b.z
        });
        else if (n.action === "power" && n.powerAction) h.usePower(n.powerAction), T.play("relay", {
            x: b.x,
            y: 1,
            z: b.z
        });
        else if (n.action === "cabinet") h.toggleCabinet(n.id), w.syncObjects(h.runtime.state.flags), T.play("relay", {
            x: b.x,
            y: 1,
            z: b.z
        });
        else if (n.action === "document" && n.cabinetId) {
            const S = h.readDocument(n.cabinetId);
            S && (f("document-title").textContent = S.title, f("document-text").textContent = S.text, f("document-view").hidden = !1, q(!1), f("document-close").focus())
        } else n.action === "source" ? h.locateSource(n.id) : n.action === "inspect" ? (h.interact(n.id, n.context), h.inspect(n.id, n.context, n.optional, Math.max(.3, _))) : n.action === "light" && (h.interact(n.id, n.context), J = !J, w.emergencyMode = J || !!h.runtime.state.flags.emergency, T.play("relay", {
            x: -w.definition.size.width / 2,
            y: 1.3,
            z: 2
        }))
    }
    if (j.paused) return;
    const c = C.down("KeyC") || C.down("ControlLeft"),
        u = C.down("ShiftLeft") && !c && i > .001;
    h.horrorExitApproach(b.x, b.z), h.horrorResponse(a, i > .001, u, b.yaw, b.x, b.z, U.visible, h.runtime.unlocked);
    const d = h.fearSnapshot(),
        l = !!h.runtime.state.power?.solved || !!h.runtime.state.flags.read || h.runtime.unlocked && h.campaign.state.index === 12 || h.threat.style === "reward" && !!h.runtime.state.flags.collected,
        y = nt.update(a, {
            x: b.x,
            z: b.z,
            yaw: b.yaw,
            running: u,
            crouching: c,
            moving: i > .001,
            interacted: r,
            provoked: l,
            flashlight: U.visible,
            lookingAtThreat: n?.id === "observation-window",
            fear: d,
            roomIndex: h.campaign.state.index
        }, w.collision);
    if (w.syncThreat(h.threat, b), w.syncPrediction(h.threat, h.predictionBrief(), b, h.routeForCopy(), {
            breaks: h.fear.modelBreaks,
            confirmations: h.fear.modelConfirmations
        }), y.previous !== y.phase || y.event === "no_event") {
        const S = {
                x: h.threat.x,
                y: 1.4,
                z: h.threat.z
            },
            k = {
                x: h.threat.plan.cueX,
                y: 1.5,
                z: h.threat.plan.cueZ
            };
        if (!["baseline", "no_event", "hunt_blackout"].includes(y.phase)) h.horrorEvent(y.phase, b.yaw, b.x, b.z, U.visible);
        if (y.previous === "silence" && y.phase === "baseline") T.setAmbience(1, .12);
        if (y.previous === "occupancy" && y.phase === "baseline" && h.runtime.state.notice === "OCCUPANCY: 2") h.runtime.state.notice = "";
        if (y.previous === "false_system" && y.phase === "baseline" && h.runtime.state.notice === "RESPONSE RECORDED.") h.runtime.state.notice = "";
        if (y.previous === "system_callback" && y.phase === "baseline") w.setSystemCallback(""), h.clearSystemCallback();
        if (y.event === "post_blackout") h.horrorOpportunity("POST_BLACKOUT");
        if (y.previous === "report" && y.phase === "baseline") h.fear.reportComplete = !0;
        if (y.phase === "impact") T.playSample(h.campaign.state.index % 2 ? "pipe1" : "pipe2", k, .34, .92) || T.play("impact", k);
        if (["step", "extra_step", "mimic_steps"].includes(y.phase)) {
            const I = y.phase === "step" ? 2 : y.phase === "extra_step" ? 3 : 5;
            for (let L = 0; L < I; L++) window.setTimeout(() => {
                const V = {
                    x: b.x + Math.sin(b.yaw) * (1.3 + L * .34),
                    y: .12,
                    z: b.z + Math.cos(b.yaw) * (1.3 + L * .34)
                };
                T.playSample(L % 2 ? "step2" : "step1", V, .32, y.phase === "mimic_steps" ? .94 : 1) || T.play("step", V)
            }, L * (y.phase === "mimic_steps" ? 310 : 220))
        }
        if (y.phase === "previous_room_mutation") T.playSample("relay", {
            x: w.definition.size.width / 2 + 1.8,
            y: 1.7,
            z: 0
        }, .10, .74);
        if (["camera", "camera_reposition", "camera_led"].includes(y.phase)) {
            const I = {
                x: w.definition.size.width / 2 - .5,
                y: 2.85,
                z: -w.definition.size.depth / 2 + .8
            };
            T.playSample("servo", I, .24) || T.play("relay", I)
        };
        if (y.phase === "speaker_click") {
            const I = {
                x: 2.15,
                y: 2.2,
                z: -w.definition.size.depth / 2 + .2
            };
            T.playSample("speaker_click", I, .26) || T.play("relay", I)
        };
        if (y.phase === "silence") T.setAmbience(.015, .09);
        if (["prop", "prop_rotate", "cabinet_open", "blackout_prop", "previous_room_mutation"].includes(y.phase)) w.applyHorrorProp(y.phase);
        if (y.phase === "blackout_observer") T.play("relay", k);
        if (y.phase === "occupancy") h.runtime.state.notice = "OCCUPANCY: 2";
        if (y.phase === "false_system" && !h.runtime.state.notice) h.runtime.state.notice = "RESPONSE RECORDED.";
        if (y.phase === "system_callback") w.setSystemCallback(h.consumeSystemCallback());
        if (y.phase === "door_relock") {
            w.targetOpen = !1;
            const I = {
                x: 0,
                y: 1.2,
                z: w.definition.door.z
            };
            T.playSample("relay", I, .35, .82) || T.play("door", I)
        };
        if (y.phase === "hunt_blackout") T.playSample("relay", {
            x: b.x,
            y: 1.4,
            z: b.z
        }, .22, .72) || T.play("impact", {
            x: b.x,
            y: 1.4,
            z: b.z
        });
        if (y.phase === "hunt_reveal") T.playSample("airflow", S, .08, .78);
        if (y.phase === "hunt") T.play("stalk", S);
        if (y.phase === "caught") {
            h.deaths++, h.observe({
                type: "PLAYER_DIED",
                context: "danger",
                target: "observer"
            }), T.play("impact", {
                x: b.x,
                y: 1.6,
                z: b.z
            });
            const I = h.threat.x - b.x,
                L = h.threat.z - b.z;
            b.yaw = Math.atan2(-I, -L), b.pitch = .35, Ne(), j.paused = !0, C.active = !1, C.clear(), f("dread").style.opacity = "1", document.pointerLockElement && document.exitPointerLock(), window.setTimeout(() => {
                q(!1), f("menu").hidden = !0, f("caught").hidden = !1, f("retry").focus()
            }, 700);
            return
        }
    }
    h.campaign.state.index === 13 && w.setReactionReport(h.horrorReportLines(h.threat.phase === "report" ? h.threat.phaseTime : h.fear.reportComplete ? 10 : 0));
    const E = ["hunt", "search"].includes(h.threat.phase),
        P = Math.hypot(b.x - h.threat.x, b.z - h.threat.z);
    f("dread").style.opacity = E && P < 2.6 ? String(Math.max(.04, .48 - P * .16)) : "0", me += a, me > (E ? .8 + Math.abs(Math.sin(h.threat.age * 1.71)) * .7 : 99) && (me = 0, E && (T.play("stalk", {
        x: h.threat.x,
        y: .2,
        z: h.threat.z
    }), P < 1.6 && T.play("heartbeat", {
        x: b.x,
        y: 1.5,
        z: b.z
    }))), h.runtime.state.notice !== fe && (fe = h.runtime.state.notice, f("system-message").textContent = fe.toUpperCase()), T.update({
        x: b.x,
        y: b.y,
        z: b.z
    }, b.yaw, b.pitch), b.z < -w.definition.size.depth / 2 - 1.75 && h.threat.phase !== "door_relock" && (h.campaign.state.index !== 13 || h.fear.reportComplete) && Oi()
}
let Oe = 60,
    Se = 0;

function Ti(a) {
    if (!w) return;
    A.render(w.scene), Oe += (1 / Math.max(.001, a) - Oe) * .03, Se += a;
    const e = re.target,
        t = h.threat.phase === "door_relock" || h.campaign.state.index === 13 && !h.fear.reportComplete,
        i = j.paused || Q ? "" : e?.action === "door" ? t ? "ДВЕРЬ ВРЕМЕННО ЗАБЛОКИРОВАНА" : w.targetOpen ? "ДВЕРЬ ОТКРЫТА" : h.runtime.unlocked ? "E  ·  ОТКРЫТЬ ДВЕРЬ" : "ДВЕРЬ ЗАБЛОКИРОВАНА" : e ? re.actionable || e.action === "inspect" ? e.label : "ПОДОЙДИТЕ БЛИЖЕ" : "",
        s = f("prompt");
    f("hint").textContent = h.runtime.state.power?.location === "hand" ? "ПРЕДОХРАНИТЕЛЬ В РУКАХ · E ВСТАВИТЬ · G ПОЛОЖИТЬ" : "WASD · SHIFT БЕГ · C ПРИСЕСТЬ · E ДЕЙСТВИЕ · F ФОНАРЬ · F2 ПРОФИЛЬ · ESC ПАУЗА", s.textContent = i, s.classList.toggle("instruction-copy", hasTouchInput() && e?.id === "instruction" && !!i), f("hud").style.opacity = j.paused ? "0" : "1", Se > .5 && (f("stats").textContent = `${Math.round(Oe)} FPS / ${A.draws} DRAWS / ${A.triangles} TRI`, Se = 0)
}

function q(a = !0) {
    j.paused = !0, C.active = !1, C.clear(), T.pause(), document.pointerLockElement && document.exitPointerLock(), a && !se.visible && (f("menu").hidden = !1)
}
async function Le() {
    if (h.threat.phase === "caught") {
        f("caught").hidden = !1;
        return
    }
    f("menu-status").textContent = "";
    if (!hasTouchInput()) try {
        await A.renderer.domElement.requestPointerLock()
    } catch {
        f("hint").textContent = "WASD · СТРЕЛКИ ОБЗОР · E ВЗАИМОДЕЙСТВИЕ · F2 ПРОФИЛЬ · ESC ПАУЗА"
    }
    try {
        await T.start()
    } catch {
        f("menu-status").textContent = "Звук недоступен в этом браузере."
    }
    se.visible && se.toggle(), f("menu").hidden = !0, f("complete").hidden = !0, C.clear(), C.active = !0, j.paused = !1, De = !0, f("enter").textContent = "ПРОДОЛЖИТЬ →"
}

function at() {
    se.visible ? (se.toggle(), f("menu").hidden = !1) : (se.toggle(), f("menu").hidden = !0, q(!1))
}

function Fe() {
    return {
        version: 3,
        session: h.exportState(),
        player: {
            x: b.x,
            z: b.z,
            yaw: b.yaw,
            pitch: b.pitch
        },
        doorOpen: w.open,
        doorTarget: w.targetOpen,
        emergency: J,
        flashlight: U.visible
    }
}
f("enter").onclick = () => {
    Le()
};
f("new").onclick = () => {
    const a = f("seed").value.trim();
    if (!a) {
        f("menu-status").textContent = "Введите seed.";
        return
    }
    ye(a), De = !1, f("enter").textContent = "ВОЙТИ В КОМНАТУ →", f("menu-status").textContent = `Новый эксперимент готов · seed ${a}`
};
f("save").onclick = () => {
    try {
        Pe.save(Fe()), f("menu-status").textContent = "Сохранено на этом устройстве."
    } catch (a) {
        f("menu-status").textContent = String(a)
    }
};
f("load").onclick = () => {
    try {
        const a = Pe.load();
        if (!a) {
            f("menu-status").textContent = "Сохранения пока нет.";
            return
        }
        ye(a.session.campaign.seed, a), f("menu-status").textContent = "Состояние восстановлено. Нажмите «Продолжить».", f("enter").textContent = "ПРОДОЛЖИТЬ →"
    } catch (a) {
        f("menu-status").textContent = String(a)
    }
};
f("review").onclick = () => at();
f("back-menu").onclick = () => {
    f("complete").hidden = !0, f("menu").hidden = !1
};
f("document-close").onclick = () => {
    f("document-view").hidden = !0, Le()
};
f("retry").onclick = () => {
    if (!H) return;
    const a = structuredClone(H),
        e = h.deaths;
    ye(Z, a), h.deaths = e, Le()
};
const ve = () => {
    try {
        localStorage.setItem("observed-settings", JSON.stringify({
            mute: f("mute").checked,
            flicker: f("flicker").checked,
            invert: f("invert").checked,
            resolution: f("resolution").value
        }))
    } catch {}
};
f("mute").onchange = () => {
    T.setMuted(f("mute").checked), ve()
};
f("flicker").onchange = () => {
    w.reducedFlicker = f("flicker").checked, ve()
};
f("invert").onchange = () => {
    b.invertY = f("invert").checked, ve()
};
f("resolution").onchange = () => {
    A.resolution = Number(f("resolution").value), A.resize(), ve()
};
try {
    const a = JSON.parse(localStorage.getItem("observed-settings") ?? "null");
    if (a) {
        for (const e of ["mute", "flicker", "invert"]) f(e).checked = a[e] === !0;
        ["180", "270", "360"].includes(a.resolution) && (f("resolution").value = a.resolution), T.setMuted(a.mute === !0), A.resolution = Number(f("resolution").value), A.resize()
    }
} catch {}
window.addEventListener("keydown", a => {
    if (!f("document-view").hidden) {
        a.code === "Escape" && (f("document-view").hidden = !0, f("menu").hidden = !1), a.code === "F2" && a.preventDefault();
        return
    }
    a.code === "F2" && (a.preventDefault(), at()), a.code === "Escape" && !j.paused && q()
});
document.addEventListener("pointerlockchange", () => {
    !hasTouchInput() && !document.pointerLockElement && !j.paused && !Q && q()
});
window.addEventListener("blur", () => {
    De && q()
});
document.addEventListener("visibilitychange", () => {
    document.hidden && q()
});
ye(Z);
A.renderer.setAnimationLoop(j.frame);


/* OBSERVED 0.14.2 — adaptive mobile input layer */
const mobileInputQuery = window.matchMedia("(pointer: coarse)");
const hasTouchInput = () => mobileInputQuery.matches || (navigator.maxTouchPoints || 0) > 0;
const mobileControls = document.createElement("div");
mobileControls.id = "mobile-controls";
mobileControls.setAttribute("aria-label", "Мобильное управление");
mobileControls.innerHTML = `
  <button id="mobile-pause" class="mobile-top-button" type="button" aria-label="Пауза">Ⅱ</button>
  <div id="mobile-look-zone" aria-label="Зона обзора"></div>
  <div id="mobile-stick" aria-label="Стик движения">
    <div id="mobile-stick-ring"></div>
    <div id="mobile-stick-knob"></div>
  </div>
  <div id="mobile-actions">
    <button id="mobile-crouch" class="mobile-action mobile-action-small" type="button" aria-pressed="false"><span>ПРИСЕСТЬ</span></button>
    <button id="mobile-flash" class="mobile-action mobile-action-small" type="button"><span>ФОНАРЬ</span></button>
    <button id="mobile-interact" class="mobile-action mobile-action-main" type="button"><span>ДЕЙСТВИЕ</span></button>
  </div>
  <div id="mobile-orientation-note" aria-hidden="true">ГОРИЗОНТАЛЬНО УДОБНЕЕ</div>`;
ce.append(mobileControls);

const mobileProfile = document.createElement("button");
mobileProfile.id = "mobile-profile";
mobileProfile.className = "secondary mobile-menu-only";
mobileProfile.type = "button";
mobileProfile.textContent = "ПРОФИЛЬ";
f("enter").parentElement?.append(mobileProfile);
mobileProfile.onclick = () => at();

const mobileDebugClose = document.createElement("button");
mobileDebugClose.id = "mobile-debug-close";
mobileDebugClose.className = "secondary mobile-menu-only";
mobileDebugClose.type = "button";
mobileDebugClose.textContent = "ЗАКРЫТЬ";
se.element.querySelector("header")?.append(mobileDebugClose);
mobileDebugClose.onclick = () => at();

const mobileFullscreen = document.createElement("button");
mobileFullscreen.id = "mobile-fullscreen";
mobileFullscreen.className = "secondary mobile-menu-only";
mobileFullscreen.type = "button";
mobileFullscreen.textContent = "НА ВЕСЬ ЭКРАН";
f("enter").parentElement?.append(mobileFullscreen);
mobileFullscreen.onclick = async () => {
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({navigationUI:"hide"});
        else if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    } catch {}
};

const mobileState = { stickPointer:null, lookPointer:null, crouch:false, lastLookX:0, lastLookY:0 };
const mobileStick = f("mobile-stick"), mobileKnob = f("mobile-stick-knob"), lookZone = f("mobile-look-zone");
const crouchButton = f("mobile-crouch"), flashButton = f("mobile-flash"), interactButton = f("mobile-interact"), pauseButton = f("mobile-pause");

function setMobileMode() {
    const on = hasTouchInput();
    document.documentElement.classList.toggle("mobile-input", on);
    if (on) {
        f("hint").textContent = "ЛЕВЫЙ СТИК · СВАЙП СПРАВА — ОБЗОР · ДЕЙСТВИЕ — ВЗАИМОДЕЙСТВИЕ";
        const controls = f("menu")?.querySelector(".controls");
        if (controls) controls.innerHTML = `<b>ЛЕВЫЙ СТИК</b><span>Движение · край стика — бег</span><b>СВАЙП СПРАВА</b><span>Осмотреться</span><b>ДЕЙСТВИЕ</b><span>Взаимодействовать</span><b>ФОНАРЬ</b><span>Включить / выключить</span><b>ПРИСЕСТЬ</b><span>Режим тихого движения</span>`;
    }
}
setMobileMode();
mobileInputQuery.addEventListener?.("change", setMobileMode);

function mobilePress(code) {
    if (!C.active || j.paused) return;
    C.pressed.add(code);
    navigator.vibrate?.(8);
}
function resetMobileToggles() {
    mobileState.crouch = false;
    C.keys.delete("KeyC");
    C.keys.delete("ShiftLeft");
    crouchButton.classList.remove("active");
    crouchButton.setAttribute("aria-pressed", "false");
}
function resetMobileStick() {
    mobileState.stickPointer = null;
    C.virtualMoveX = 0;
    C.virtualMoveY = 0;
    C.keys.delete("ShiftLeft");
    mobileKnob.style.transform = "translate3d(0,0,0)";
    mobileStick.classList.remove("engaged", "sprinting");
}
function updateMobileStick(clientX, clientY) {
    const rect = mobileStick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = clientX - cx, dy = clientY - cy;
    const radius = Math.max(28, rect.width * .34), distance = Math.hypot(dx, dy), clamped = Math.min(distance, radius);
    if (distance > 0) { dx = dx / distance * clamped; dy = dy / distance * clamped; }
    const nx = dx / radius, ny = -dy / radius;
    C.virtualMoveX = Math.abs(nx) < .08 ? 0 : nx;
    C.virtualMoveY = Math.abs(ny) < .08 ? 0 : ny;
    mobileKnob.style.transform = `translate3d(${dx}px,${dy}px,0)`;
    const sprint = !mobileState.crouch && Math.hypot(nx,ny) > .88;
    C.keys.toggle ? C.keys.toggle("ShiftLeft", sprint) : (sprint ? C.keys.add("ShiftLeft") : C.keys.delete("ShiftLeft"));
    mobileStick.classList.toggle("sprinting", sprint);
}
mobileStick.addEventListener("pointerdown", e => {
    if (!C.active || j.paused || mobileState.stickPointer !== null) return;
    mobileState.stickPointer = e.pointerId;
    mobileStick.setPointerCapture?.(e.pointerId);
    mobileStick.classList.add("engaged");
    updateMobileStick(e.clientX, e.clientY);
    e.preventDefault();
});
mobileStick.addEventListener("pointermove", e => {
    if (e.pointerId !== mobileState.stickPointer) return;
    updateMobileStick(e.clientX, e.clientY);
    e.preventDefault();
});
for (const type of ["pointerup","pointercancel","lostpointercapture"]) mobileStick.addEventListener(type, e => {
    if (mobileState.stickPointer === null || (e.pointerId !== undefined && e.pointerId !== mobileState.stickPointer)) return;
    resetMobileStick();
});

lookZone.addEventListener("pointerdown", e => {
    if (!C.active || j.paused || mobileState.lookPointer !== null) return;
    mobileState.lookPointer = e.pointerId;
    mobileState.lastLookX = e.clientX; mobileState.lastLookY = e.clientY;
    lookZone.setPointerCapture?.(e.pointerId);
    e.preventDefault();
});
lookZone.addEventListener("pointermove", e => {
    if (e.pointerId !== mobileState.lookPointer || !C.active || j.paused) return;
    const dx = e.clientX - mobileState.lastLookX, dy = e.clientY - mobileState.lastLookY;
    mobileState.lastLookX = e.clientX; mobileState.lastLookY = e.clientY;
    const sensitivity = matchMedia("(orientation: portrait)").matches ? 1.85 : 1.65;
    C.dx += dx * sensitivity; C.dy += dy * sensitivity;
    e.preventDefault();
});
for (const type of ["pointerup","pointercancel","lostpointercapture"]) lookZone.addEventListener(type, e => {
    if (mobileState.lookPointer === null || (e.pointerId !== undefined && e.pointerId !== mobileState.lookPointer)) return;
    mobileState.lookPointer = null;
});

interactButton.addEventListener("pointerdown", e => { mobilePress("KeyE"); interactButton.classList.add("pressed"); e.preventDefault(); });
flashButton.addEventListener("pointerdown", e => { mobilePress("KeyF"); flashButton.classList.add("pressed"); e.preventDefault(); });
for (const button of [interactButton, flashButton]) for (const type of ["pointerup","pointercancel","pointerleave"]) button.addEventListener(type, () => button.classList.remove("pressed"));
crouchButton.addEventListener("pointerdown", e => {
    if (!C.active || j.paused) return;
    mobileState.crouch = !mobileState.crouch;
    crouchButton.setAttribute("aria-pressed", String(mobileState.crouch));
    crouchButton.classList.toggle("active", mobileState.crouch);
    mobileState.crouch ? C.keys.add("KeyC") : C.keys.delete("KeyC");
    if (mobileState.crouch) C.keys.delete("ShiftLeft");
    navigator.vibrate?.(8);
    e.preventDefault();
});
pauseButton.addEventListener("pointerdown", e => {
    if (!j.paused) q();
    resetMobileStick();
    resetMobileToggles();
    e.preventDefault();
});

for (const el of [mobileControls, mobileStick, lookZone, interactButton, flashButton, crouchButton, pauseButton]) {
    el.addEventListener("contextmenu", e => e.preventDefault());
}
window.addEventListener("blur", () => { resetMobileStick(); resetMobileToggles(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) { resetMobileStick(); resetMobileToggles(); } });
new MutationObserver(() => { if (!f("menu").hidden) { resetMobileStick(); resetMobileToggles(); } }).observe(f("menu"), {attributes:true, attributeFilter:["hidden"]});
window.addEventListener("orientationchange", () => { resetMobileStick(); setTimeout(() => A.resize(), 60); });
let mobileResizeRAF = 0;
window.visualViewport?.addEventListener("resize", () => { cancelAnimationFrame(mobileResizeRAF); mobileResizeRAF = requestAnimationFrame(() => A.resize()); });
if (!document.documentElement.requestFullscreen) mobileFullscreen.hidden = true;
