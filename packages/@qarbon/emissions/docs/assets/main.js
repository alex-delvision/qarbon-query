'use strict';
'use strict';
(() => {
  var Ce = Object.create;
  var ne = Object.defineProperty;
  var Pe = Object.getOwnPropertyDescriptor;
  var Oe = Object.getOwnPropertyNames;
  var _e = Object.getPrototypeOf,
    Re = Object.prototype.hasOwnProperty;
  var Me = (t, e) => () => (
    e || t((e = { exports: {} }).exports, e),
    e.exports
  );
  var Fe = (t, e, n, r) => {
    if ((e && typeof e == 'object') || typeof e == 'function')
      for (let i of Oe(e))
        !Re.call(t, i) &&
          i !== n &&
          ne(t, i, {
            get: () => e[i],
            enumerable: !(r = Pe(e, i)) || r.enumerable,
          });
    return t;
  };
  var De = (t, e, n) => (
    (n = t != null ? Ce(_e(t)) : {}),
    Fe(
      e || !t || !t.__esModule
        ? ne(n, 'default', { value: t, enumerable: !0 })
        : n,
      t
    )
  );
  var ae = Me((se, oe) => {
    (function () {
      var t = function (e) {
        var n = new t.Builder();
        return (
          n.pipeline.add(t.trimmer, t.stopWordFilter, t.stemmer),
          n.searchPipeline.add(t.stemmer),
          e.call(n, n),
          n.build()
        );
      };
      t.version = '2.3.9';
      ((t.utils = {}),
        (t.utils.warn = (function (e) {
          return function (n) {
            e.console && console.warn && console.warn(n);
          };
        })(this)),
        (t.utils.asString = function (e) {
          return e == null ? '' : e.toString();
        }),
        (t.utils.clone = function (e) {
          if (e == null) return e;
          for (
            var n = Object.create(null), r = Object.keys(e), i = 0;
            i < r.length;
            i++
          ) {
            var s = r[i],
              o = e[s];
            if (Array.isArray(o)) {
              n[s] = o.slice();
              continue;
            }
            if (
              typeof o == 'string' ||
              typeof o == 'number' ||
              typeof o == 'boolean'
            ) {
              n[s] = o;
              continue;
            }
            throw new TypeError(
              'clone is not deep and does not support nested objects'
            );
          }
          return n;
        }),
        (t.FieldRef = function (e, n, r) {
          ((this.docRef = e), (this.fieldName = n), (this._stringValue = r));
        }),
        (t.FieldRef.joiner = '/'),
        (t.FieldRef.fromString = function (e) {
          var n = e.indexOf(t.FieldRef.joiner);
          if (n === -1) throw 'malformed field ref string';
          var r = e.slice(0, n),
            i = e.slice(n + 1);
          return new t.FieldRef(i, r, e);
        }),
        (t.FieldRef.prototype.toString = function () {
          return (
            this._stringValue == null &&
              (this._stringValue =
                this.fieldName + t.FieldRef.joiner + this.docRef),
            this._stringValue
          );
        }));
      ((t.Set = function (e) {
        if (((this.elements = Object.create(null)), e)) {
          this.length = e.length;
          for (var n = 0; n < this.length; n++) this.elements[e[n]] = !0;
        } else this.length = 0;
      }),
        (t.Set.complete = {
          intersect: function (e) {
            return e;
          },
          union: function () {
            return this;
          },
          contains: function () {
            return !0;
          },
        }),
        (t.Set.empty = {
          intersect: function () {
            return this;
          },
          union: function (e) {
            return e;
          },
          contains: function () {
            return !1;
          },
        }),
        (t.Set.prototype.contains = function (e) {
          return !!this.elements[e];
        }),
        (t.Set.prototype.intersect = function (e) {
          var n,
            r,
            i,
            s = [];
          if (e === t.Set.complete) return this;
          if (e === t.Set.empty) return e;
          (this.length < e.length
            ? ((n = this), (r = e))
            : ((n = e), (r = this)),
            (i = Object.keys(n.elements)));
          for (var o = 0; o < i.length; o++) {
            var a = i[o];
            a in r.elements && s.push(a);
          }
          return new t.Set(s);
        }),
        (t.Set.prototype.union = function (e) {
          return e === t.Set.complete
            ? t.Set.complete
            : e === t.Set.empty
              ? this
              : new t.Set(
                  Object.keys(this.elements).concat(Object.keys(e.elements))
                );
        }),
        (t.idf = function (e, n) {
          var r = 0;
          for (var i in e) i != '_index' && (r += Object.keys(e[i]).length);
          var s = (n - r + 0.5) / (r + 0.5);
          return Math.log(1 + Math.abs(s));
        }),
        (t.Token = function (e, n) {
          ((this.str = e || ''), (this.metadata = n || {}));
        }),
        (t.Token.prototype.toString = function () {
          return this.str;
        }),
        (t.Token.prototype.update = function (e) {
          return ((this.str = e(this.str, this.metadata)), this);
        }),
        (t.Token.prototype.clone = function (e) {
          return (
            (e =
              e ||
              function (n) {
                return n;
              }),
            new t.Token(e(this.str, this.metadata), this.metadata)
          );
        }));
      ((t.tokenizer = function (e, n) {
        if (e == null || e == null) return [];
        if (Array.isArray(e))
          return e.map(function (y) {
            return new t.Token(
              t.utils.asString(y).toLowerCase(),
              t.utils.clone(n)
            );
          });
        for (
          var r = e.toString().toLowerCase(),
            i = r.length,
            s = [],
            o = 0,
            a = 0;
          o <= i;
          o++
        ) {
          var l = r.charAt(o),
            u = o - a;
          if (l.match(t.tokenizer.separator) || o == i) {
            if (u > 0) {
              var d = t.utils.clone(n) || {};
              ((d.position = [a, u]),
                (d.index = s.length),
                s.push(new t.Token(r.slice(a, o), d)));
            }
            a = o + 1;
          }
        }
        return s;
      }),
        (t.tokenizer.separator = /[\s\-]+/));
      ((t.Pipeline = function () {
        this._stack = [];
      }),
        (t.Pipeline.registeredFunctions = Object.create(null)),
        (t.Pipeline.registerFunction = function (e, n) {
          (n in this.registeredFunctions &&
            t.utils.warn('Overwriting existing registered function: ' + n),
            (e.label = n),
            (t.Pipeline.registeredFunctions[e.label] = e));
        }),
        (t.Pipeline.warnIfFunctionNotRegistered = function (e) {
          var n = e.label && e.label in this.registeredFunctions;
          n ||
            t.utils.warn(
              `Function is not registered with pipeline. This may cause problems when serialising the index.
`,
              e
            );
        }),
        (t.Pipeline.load = function (e) {
          var n = new t.Pipeline();
          return (
            e.forEach(function (r) {
              var i = t.Pipeline.registeredFunctions[r];
              if (i) n.add(i);
              else throw new Error('Cannot load unregistered function: ' + r);
            }),
            n
          );
        }),
        (t.Pipeline.prototype.add = function () {
          var e = Array.prototype.slice.call(arguments);
          e.forEach(function (n) {
            (t.Pipeline.warnIfFunctionNotRegistered(n), this._stack.push(n));
          }, this);
        }),
        (t.Pipeline.prototype.after = function (e, n) {
          t.Pipeline.warnIfFunctionNotRegistered(n);
          var r = this._stack.indexOf(e);
          if (r == -1) throw new Error('Cannot find existingFn');
          ((r = r + 1), this._stack.splice(r, 0, n));
        }),
        (t.Pipeline.prototype.before = function (e, n) {
          t.Pipeline.warnIfFunctionNotRegistered(n);
          var r = this._stack.indexOf(e);
          if (r == -1) throw new Error('Cannot find existingFn');
          this._stack.splice(r, 0, n);
        }),
        (t.Pipeline.prototype.remove = function (e) {
          var n = this._stack.indexOf(e);
          n != -1 && this._stack.splice(n, 1);
        }),
        (t.Pipeline.prototype.run = function (e) {
          for (var n = this._stack.length, r = 0; r < n; r++) {
            for (var i = this._stack[r], s = [], o = 0; o < e.length; o++) {
              var a = i(e[o], o, e);
              if (!(a == null || a === ''))
                if (Array.isArray(a))
                  for (var l = 0; l < a.length; l++) s.push(a[l]);
                else s.push(a);
            }
            e = s;
          }
          return e;
        }),
        (t.Pipeline.prototype.runString = function (e, n) {
          var r = new t.Token(e, n);
          return this.run([r]).map(function (i) {
            return i.toString();
          });
        }),
        (t.Pipeline.prototype.reset = function () {
          this._stack = [];
        }),
        (t.Pipeline.prototype.toJSON = function () {
          return this._stack.map(function (e) {
            return (t.Pipeline.warnIfFunctionNotRegistered(e), e.label);
          });
        }));
      ((t.Vector = function (e) {
        ((this._magnitude = 0), (this.elements = e || []));
      }),
        (t.Vector.prototype.positionForIndex = function (e) {
          if (this.elements.length == 0) return 0;
          for (
            var n = 0,
              r = this.elements.length / 2,
              i = r - n,
              s = Math.floor(i / 2),
              o = this.elements[s * 2];
            i > 1 && (o < e && (n = s), o > e && (r = s), o != e);

          )
            ((i = r - n),
              (s = n + Math.floor(i / 2)),
              (o = this.elements[s * 2]));
          if (o == e || o > e) return s * 2;
          if (o < e) return (s + 1) * 2;
        }),
        (t.Vector.prototype.insert = function (e, n) {
          this.upsert(e, n, function () {
            throw 'duplicate index';
          });
        }),
        (t.Vector.prototype.upsert = function (e, n, r) {
          this._magnitude = 0;
          var i = this.positionForIndex(e);
          this.elements[i] == e
            ? (this.elements[i + 1] = r(this.elements[i + 1], n))
            : this.elements.splice(i, 0, e, n);
        }),
        (t.Vector.prototype.magnitude = function () {
          if (this._magnitude) return this._magnitude;
          for (var e = 0, n = this.elements.length, r = 1; r < n; r += 2) {
            var i = this.elements[r];
            e += i * i;
          }
          return (this._magnitude = Math.sqrt(e));
        }),
        (t.Vector.prototype.dot = function (e) {
          for (
            var n = 0,
              r = this.elements,
              i = e.elements,
              s = r.length,
              o = i.length,
              a = 0,
              l = 0,
              u = 0,
              d = 0;
            u < s && d < o;

          )
            ((a = r[u]),
              (l = i[d]),
              a < l
                ? (u += 2)
                : a > l
                  ? (d += 2)
                  : a == l && ((n += r[u + 1] * i[d + 1]), (u += 2), (d += 2)));
          return n;
        }),
        (t.Vector.prototype.similarity = function (e) {
          return this.dot(e) / this.magnitude() || 0;
        }),
        (t.Vector.prototype.toArray = function () {
          for (
            var e = new Array(this.elements.length / 2), n = 1, r = 0;
            n < this.elements.length;
            n += 2, r++
          )
            e[r] = this.elements[n];
          return e;
        }),
        (t.Vector.prototype.toJSON = function () {
          return this.elements;
        }));
      ((t.stemmer = (function () {
        var e = {
            ational: 'ate',
            tional: 'tion',
            enci: 'ence',
            anci: 'ance',
            izer: 'ize',
            bli: 'ble',
            alli: 'al',
            entli: 'ent',
            eli: 'e',
            ousli: 'ous',
            ization: 'ize',
            ation: 'ate',
            ator: 'ate',
            alism: 'al',
            iveness: 'ive',
            fulness: 'ful',
            ousness: 'ous',
            aliti: 'al',
            iviti: 'ive',
            biliti: 'ble',
            logi: 'log',
          },
          n = {
            icate: 'ic',
            ative: '',
            alize: 'al',
            iciti: 'ic',
            ical: 'ic',
            ful: '',
            ness: '',
          },
          r = '[^aeiou]',
          i = '[aeiouy]',
          s = r + '[^aeiouy]*',
          o = i + '[aeiou]*',
          a = '^(' + s + ')?' + o + s,
          l = '^(' + s + ')?' + o + s + '(' + o + ')?$',
          u = '^(' + s + ')?' + o + s + o + s,
          d = '^(' + s + ')?' + i,
          y = new RegExp(a),
          p = new RegExp(u),
          b = new RegExp(l),
          g = new RegExp(d),
          L = /^(.+?)(ss|i)es$/,
          f = /^(.+?)([^s])s$/,
          m = /^(.+?)eed$/,
          S = /^(.+?)(ed|ing)$/,
          w = /.$/,
          k = /(at|bl|iz)$/,
          _ = new RegExp('([^aeiouylsz])\\1$'),
          B = new RegExp('^' + s + i + '[^aeiouwxy]$'),
          A = /^(.+?[^aeiou])y$/,
          j =
            /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/,
          $ = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/,
          V =
            /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/,
          q = /^(.+?)(s|t)(ion)$/,
          C = /^(.+?)e$/,
          z = /ll$/,
          W = new RegExp('^' + s + i + '[^aeiouwxy]$'),
          N = function (c) {
            var v, P, T, h, x, O, M;
            if (c.length < 3) return c;
            if (
              ((T = c.substr(0, 1)),
              T == 'y' && (c = T.toUpperCase() + c.substr(1)),
              (h = L),
              (x = f),
              h.test(c)
                ? (c = c.replace(h, '$1$2'))
                : x.test(c) && (c = c.replace(x, '$1$2')),
              (h = m),
              (x = S),
              h.test(c))
            ) {
              var E = h.exec(c);
              ((h = y), h.test(E[1]) && ((h = w), (c = c.replace(h, ''))));
            } else if (x.test(c)) {
              var E = x.exec(c);
              ((v = E[1]),
                (x = g),
                x.test(v) &&
                  ((c = v),
                  (x = k),
                  (O = _),
                  (M = B),
                  x.test(c)
                    ? (c = c + 'e')
                    : O.test(c)
                      ? ((h = w), (c = c.replace(h, '')))
                      : M.test(c) && (c = c + 'e')));
            }
            if (((h = A), h.test(c))) {
              var E = h.exec(c);
              ((v = E[1]), (c = v + 'i'));
            }
            if (((h = j), h.test(c))) {
              var E = h.exec(c);
              ((v = E[1]), (P = E[2]), (h = y), h.test(v) && (c = v + e[P]));
            }
            if (((h = $), h.test(c))) {
              var E = h.exec(c);
              ((v = E[1]), (P = E[2]), (h = y), h.test(v) && (c = v + n[P]));
            }
            if (((h = V), (x = q), h.test(c))) {
              var E = h.exec(c);
              ((v = E[1]), (h = p), h.test(v) && (c = v));
            } else if (x.test(c)) {
              var E = x.exec(c);
              ((v = E[1] + E[2]), (x = p), x.test(v) && (c = v));
            }
            if (((h = C), h.test(c))) {
              var E = h.exec(c);
              ((v = E[1]),
                (h = p),
                (x = b),
                (O = W),
                (h.test(v) || (x.test(v) && !O.test(v))) && (c = v));
            }
            return (
              (h = z),
              (x = p),
              h.test(c) && x.test(c) && ((h = w), (c = c.replace(h, ''))),
              T == 'y' && (c = T.toLowerCase() + c.substr(1)),
              c
            );
          };
        return function (R) {
          return R.update(N);
        };
      })()),
        t.Pipeline.registerFunction(t.stemmer, 'stemmer'));
      ((t.generateStopWordFilter = function (e) {
        var n = e.reduce(function (r, i) {
          return ((r[i] = i), r);
        }, {});
        return function (r) {
          if (r && n[r.toString()] !== r.toString()) return r;
        };
      }),
        (t.stopWordFilter = t.generateStopWordFilter([
          'a',
          'able',
          'about',
          'across',
          'after',
          'all',
          'almost',
          'also',
          'am',
          'among',
          'an',
          'and',
          'any',
          'are',
          'as',
          'at',
          'be',
          'because',
          'been',
          'but',
          'by',
          'can',
          'cannot',
          'could',
          'dear',
          'did',
          'do',
          'does',
          'either',
          'else',
          'ever',
          'every',
          'for',
          'from',
          'get',
          'got',
          'had',
          'has',
          'have',
          'he',
          'her',
          'hers',
          'him',
          'his',
          'how',
          'however',
          'i',
          'if',
          'in',
          'into',
          'is',
          'it',
          'its',
          'just',
          'least',
          'let',
          'like',
          'likely',
          'may',
          'me',
          'might',
          'most',
          'must',
          'my',
          'neither',
          'no',
          'nor',
          'not',
          'of',
          'off',
          'often',
          'on',
          'only',
          'or',
          'other',
          'our',
          'own',
          'rather',
          'said',
          'say',
          'says',
          'she',
          'should',
          'since',
          'so',
          'some',
          'than',
          'that',
          'the',
          'their',
          'them',
          'then',
          'there',
          'these',
          'they',
          'this',
          'tis',
          'to',
          'too',
          'twas',
          'us',
          'wants',
          'was',
          'we',
          'were',
          'what',
          'when',
          'where',
          'which',
          'while',
          'who',
          'whom',
          'why',
          'will',
          'with',
          'would',
          'yet',
          'you',
          'your',
        ])),
        t.Pipeline.registerFunction(t.stopWordFilter, 'stopWordFilter'));
      ((t.trimmer = function (e) {
        return e.update(function (n) {
          return n.replace(/^\W+/, '').replace(/\W+$/, '');
        });
      }),
        t.Pipeline.registerFunction(t.trimmer, 'trimmer'));
      ((t.TokenSet = function () {
        ((this.final = !1),
          (this.edges = {}),
          (this.id = t.TokenSet._nextId),
          (t.TokenSet._nextId += 1));
      }),
        (t.TokenSet._nextId = 1),
        (t.TokenSet.fromArray = function (e) {
          for (
            var n = new t.TokenSet.Builder(), r = 0, i = e.length;
            r < i;
            r++
          )
            n.insert(e[r]);
          return (n.finish(), n.root);
        }),
        (t.TokenSet.fromClause = function (e) {
          return 'editDistance' in e
            ? t.TokenSet.fromFuzzyString(e.term, e.editDistance)
            : t.TokenSet.fromString(e.term);
        }),
        (t.TokenSet.fromFuzzyString = function (e, n) {
          for (
            var r = new t.TokenSet(),
              i = [{ node: r, editsRemaining: n, str: e }];
            i.length;

          ) {
            var s = i.pop();
            if (s.str.length > 0) {
              var o = s.str.charAt(0),
                a;
              (o in s.node.edges
                ? (a = s.node.edges[o])
                : ((a = new t.TokenSet()), (s.node.edges[o] = a)),
                s.str.length == 1 && (a.final = !0),
                i.push({
                  node: a,
                  editsRemaining: s.editsRemaining,
                  str: s.str.slice(1),
                }));
            }
            if (s.editsRemaining != 0) {
              if ('*' in s.node.edges) var l = s.node.edges['*'];
              else {
                var l = new t.TokenSet();
                s.node.edges['*'] = l;
              }
              if (
                (s.str.length == 0 && (l.final = !0),
                i.push({
                  node: l,
                  editsRemaining: s.editsRemaining - 1,
                  str: s.str,
                }),
                s.str.length > 1 &&
                  i.push({
                    node: s.node,
                    editsRemaining: s.editsRemaining - 1,
                    str: s.str.slice(1),
                  }),
                s.str.length == 1 && (s.node.final = !0),
                s.str.length >= 1)
              ) {
                if ('*' in s.node.edges) var u = s.node.edges['*'];
                else {
                  var u = new t.TokenSet();
                  s.node.edges['*'] = u;
                }
                (s.str.length == 1 && (u.final = !0),
                  i.push({
                    node: u,
                    editsRemaining: s.editsRemaining - 1,
                    str: s.str.slice(1),
                  }));
              }
              if (s.str.length > 1) {
                var d = s.str.charAt(0),
                  y = s.str.charAt(1),
                  p;
                (y in s.node.edges
                  ? (p = s.node.edges[y])
                  : ((p = new t.TokenSet()), (s.node.edges[y] = p)),
                  s.str.length == 1 && (p.final = !0),
                  i.push({
                    node: p,
                    editsRemaining: s.editsRemaining - 1,
                    str: d + s.str.slice(2),
                  }));
              }
            }
          }
          return r;
        }),
        (t.TokenSet.fromString = function (e) {
          for (
            var n = new t.TokenSet(), r = n, i = 0, s = e.length;
            i < s;
            i++
          ) {
            var o = e[i],
              a = i == s - 1;
            if (o == '*') ((n.edges[o] = n), (n.final = a));
            else {
              var l = new t.TokenSet();
              ((l.final = a), (n.edges[o] = l), (n = l));
            }
          }
          return r;
        }),
        (t.TokenSet.prototype.toArray = function () {
          for (var e = [], n = [{ prefix: '', node: this }]; n.length; ) {
            var r = n.pop(),
              i = Object.keys(r.node.edges),
              s = i.length;
            r.node.final && (r.prefix.charAt(0), e.push(r.prefix));
            for (var o = 0; o < s; o++) {
              var a = i[o];
              n.push({ prefix: r.prefix.concat(a), node: r.node.edges[a] });
            }
          }
          return e;
        }),
        (t.TokenSet.prototype.toString = function () {
          if (this._str) return this._str;
          for (
            var e = this.final ? '1' : '0',
              n = Object.keys(this.edges).sort(),
              r = n.length,
              i = 0;
            i < r;
            i++
          ) {
            var s = n[i],
              o = this.edges[s];
            e = e + s + o.id;
          }
          return e;
        }),
        (t.TokenSet.prototype.intersect = function (e) {
          for (
            var n = new t.TokenSet(),
              r = void 0,
              i = [{ qNode: e, output: n, node: this }];
            i.length;

          ) {
            r = i.pop();
            for (
              var s = Object.keys(r.qNode.edges),
                o = s.length,
                a = Object.keys(r.node.edges),
                l = a.length,
                u = 0;
              u < o;
              u++
            )
              for (var d = s[u], y = 0; y < l; y++) {
                var p = a[y];
                if (p == d || d == '*') {
                  var b = r.node.edges[p],
                    g = r.qNode.edges[d],
                    L = b.final && g.final,
                    f = void 0;
                  (p in r.output.edges
                    ? ((f = r.output.edges[p]), (f.final = f.final || L))
                    : ((f = new t.TokenSet()),
                      (f.final = L),
                      (r.output.edges[p] = f)),
                    i.push({ qNode: g, output: f, node: b }));
                }
              }
          }
          return n;
        }),
        (t.TokenSet.Builder = function () {
          ((this.previousWord = ''),
            (this.root = new t.TokenSet()),
            (this.uncheckedNodes = []),
            (this.minimizedNodes = {}));
        }),
        (t.TokenSet.Builder.prototype.insert = function (e) {
          var n,
            r = 0;
          if (e < this.previousWord)
            throw new Error('Out of order word insertion');
          for (
            var i = 0;
            i < e.length &&
            i < this.previousWord.length &&
            e[i] == this.previousWord[i];
            i++
          )
            r++;
          (this.minimize(r),
            this.uncheckedNodes.length == 0
              ? (n = this.root)
              : (n =
                  this.uncheckedNodes[this.uncheckedNodes.length - 1].child));
          for (var i = r; i < e.length; i++) {
            var s = new t.TokenSet(),
              o = e[i];
            ((n.edges[o] = s),
              this.uncheckedNodes.push({ parent: n, char: o, child: s }),
              (n = s));
          }
          ((n.final = !0), (this.previousWord = e));
        }),
        (t.TokenSet.Builder.prototype.finish = function () {
          this.minimize(0);
        }),
        (t.TokenSet.Builder.prototype.minimize = function (e) {
          for (var n = this.uncheckedNodes.length - 1; n >= e; n--) {
            var r = this.uncheckedNodes[n],
              i = r.child.toString();
            (i in this.minimizedNodes
              ? (r.parent.edges[r.char] = this.minimizedNodes[i])
              : ((r.child._str = i), (this.minimizedNodes[i] = r.child)),
              this.uncheckedNodes.pop());
          }
        }));
      ((t.Index = function (e) {
        ((this.invertedIndex = e.invertedIndex),
          (this.fieldVectors = e.fieldVectors),
          (this.tokenSet = e.tokenSet),
          (this.fields = e.fields),
          (this.pipeline = e.pipeline));
      }),
        (t.Index.prototype.search = function (e) {
          return this.query(function (n) {
            var r = new t.QueryParser(e, n);
            r.parse();
          });
        }),
        (t.Index.prototype.query = function (e) {
          for (
            var n = new t.Query(this.fields),
              r = Object.create(null),
              i = Object.create(null),
              s = Object.create(null),
              o = Object.create(null),
              a = Object.create(null),
              l = 0;
            l < this.fields.length;
            l++
          )
            i[this.fields[l]] = new t.Vector();
          e.call(n, n);
          for (var l = 0; l < n.clauses.length; l++) {
            var u = n.clauses[l],
              d = null,
              y = t.Set.empty;
            u.usePipeline
              ? (d = this.pipeline.runString(u.term, { fields: u.fields }))
              : (d = [u.term]);
            for (var p = 0; p < d.length; p++) {
              var b = d[p];
              u.term = b;
              var g = t.TokenSet.fromClause(u),
                L = this.tokenSet.intersect(g).toArray();
              if (L.length === 0 && u.presence === t.Query.presence.REQUIRED) {
                for (var f = 0; f < u.fields.length; f++) {
                  var m = u.fields[f];
                  o[m] = t.Set.empty;
                }
                break;
              }
              for (var S = 0; S < L.length; S++)
                for (
                  var w = L[S], k = this.invertedIndex[w], _ = k._index, f = 0;
                  f < u.fields.length;
                  f++
                ) {
                  var m = u.fields[f],
                    B = k[m],
                    A = Object.keys(B),
                    j = w + '/' + m,
                    $ = new t.Set(A);
                  if (
                    (u.presence == t.Query.presence.REQUIRED &&
                      ((y = y.union($)),
                      o[m] === void 0 && (o[m] = t.Set.complete)),
                    u.presence == t.Query.presence.PROHIBITED)
                  ) {
                    (a[m] === void 0 && (a[m] = t.Set.empty),
                      (a[m] = a[m].union($)));
                    continue;
                  }
                  if (
                    (i[m].upsert(_, u.boost, function (Qe, Ie) {
                      return Qe + Ie;
                    }),
                    !s[j])
                  ) {
                    for (var V = 0; V < A.length; V++) {
                      var q = A[V],
                        C = new t.FieldRef(q, m),
                        z = B[q],
                        W;
                      (W = r[C]) === void 0
                        ? (r[C] = new t.MatchData(w, m, z))
                        : W.add(w, m, z);
                    }
                    s[j] = !0;
                  }
                }
            }
            if (u.presence === t.Query.presence.REQUIRED)
              for (var f = 0; f < u.fields.length; f++) {
                var m = u.fields[f];
                o[m] = o[m].intersect(y);
              }
          }
          for (
            var N = t.Set.complete, R = t.Set.empty, l = 0;
            l < this.fields.length;
            l++
          ) {
            var m = this.fields[l];
            (o[m] && (N = N.intersect(o[m])), a[m] && (R = R.union(a[m])));
          }
          var c = Object.keys(r),
            v = [],
            P = Object.create(null);
          if (n.isNegated()) {
            c = Object.keys(this.fieldVectors);
            for (var l = 0; l < c.length; l++) {
              var C = c[l],
                T = t.FieldRef.fromString(C);
              r[C] = new t.MatchData();
            }
          }
          for (var l = 0; l < c.length; l++) {
            var T = t.FieldRef.fromString(c[l]),
              h = T.docRef;
            if (N.contains(h) && !R.contains(h)) {
              var x = this.fieldVectors[T],
                O = i[T.fieldName].similarity(x),
                M;
              if ((M = P[h]) !== void 0)
                ((M.score += O), M.matchData.combine(r[T]));
              else {
                var E = { ref: h, score: O, matchData: r[T] };
                ((P[h] = E), v.push(E));
              }
            }
          }
          return v.sort(function (Te, ke) {
            return ke.score - Te.score;
          });
        }),
        (t.Index.prototype.toJSON = function () {
          var e = Object.keys(this.invertedIndex)
              .sort()
              .map(function (r) {
                return [r, this.invertedIndex[r]];
              }, this),
            n = Object.keys(this.fieldVectors).map(function (r) {
              return [r, this.fieldVectors[r].toJSON()];
            }, this);
          return {
            version: t.version,
            fields: this.fields,
            fieldVectors: n,
            invertedIndex: e,
            pipeline: this.pipeline.toJSON(),
          };
        }),
        (t.Index.load = function (e) {
          var n = {},
            r = {},
            i = e.fieldVectors,
            s = Object.create(null),
            o = e.invertedIndex,
            a = new t.TokenSet.Builder(),
            l = t.Pipeline.load(e.pipeline);
          e.version != t.version &&
            t.utils.warn(
              "Version mismatch when loading serialised index. Current version of lunr '" +
                t.version +
                "' does not match serialized index '" +
                e.version +
                "'"
            );
          for (var u = 0; u < i.length; u++) {
            var d = i[u],
              y = d[0],
              p = d[1];
            r[y] = new t.Vector(p);
          }
          for (var u = 0; u < o.length; u++) {
            var d = o[u],
              b = d[0],
              g = d[1];
            (a.insert(b), (s[b] = g));
          }
          return (
            a.finish(),
            (n.fields = e.fields),
            (n.fieldVectors = r),
            (n.invertedIndex = s),
            (n.tokenSet = a.root),
            (n.pipeline = l),
            new t.Index(n)
          );
        }));
      ((t.Builder = function () {
        ((this._ref = 'id'),
          (this._fields = Object.create(null)),
          (this._documents = Object.create(null)),
          (this.invertedIndex = Object.create(null)),
          (this.fieldTermFrequencies = {}),
          (this.fieldLengths = {}),
          (this.tokenizer = t.tokenizer),
          (this.pipeline = new t.Pipeline()),
          (this.searchPipeline = new t.Pipeline()),
          (this.documentCount = 0),
          (this._b = 0.75),
          (this._k1 = 1.2),
          (this.termIndex = 0),
          (this.metadataWhitelist = []));
      }),
        (t.Builder.prototype.ref = function (e) {
          this._ref = e;
        }),
        (t.Builder.prototype.field = function (e, n) {
          if (/\//.test(e))
            throw new RangeError(
              "Field '" + e + "' contains illegal character '/'"
            );
          this._fields[e] = n || {};
        }),
        (t.Builder.prototype.b = function (e) {
          e < 0 ? (this._b = 0) : e > 1 ? (this._b = 1) : (this._b = e);
        }),
        (t.Builder.prototype.k1 = function (e) {
          this._k1 = e;
        }),
        (t.Builder.prototype.add = function (e, n) {
          var r = e[this._ref],
            i = Object.keys(this._fields);
          ((this._documents[r] = n || {}), (this.documentCount += 1));
          for (var s = 0; s < i.length; s++) {
            var o = i[s],
              a = this._fields[o].extractor,
              l = a ? a(e) : e[o],
              u = this.tokenizer(l, { fields: [o] }),
              d = this.pipeline.run(u),
              y = new t.FieldRef(r, o),
              p = Object.create(null);
            ((this.fieldTermFrequencies[y] = p),
              (this.fieldLengths[y] = 0),
              (this.fieldLengths[y] += d.length));
            for (var b = 0; b < d.length; b++) {
              var g = d[b];
              if (
                (p[g] == null && (p[g] = 0),
                (p[g] += 1),
                this.invertedIndex[g] == null)
              ) {
                var L = Object.create(null);
                ((L._index = this.termIndex), (this.termIndex += 1));
                for (var f = 0; f < i.length; f++)
                  L[i[f]] = Object.create(null);
                this.invertedIndex[g] = L;
              }
              this.invertedIndex[g][o][r] == null &&
                (this.invertedIndex[g][o][r] = Object.create(null));
              for (var m = 0; m < this.metadataWhitelist.length; m++) {
                var S = this.metadataWhitelist[m],
                  w = g.metadata[S];
                (this.invertedIndex[g][o][r][S] == null &&
                  (this.invertedIndex[g][o][r][S] = []),
                  this.invertedIndex[g][o][r][S].push(w));
              }
            }
          }
        }),
        (t.Builder.prototype.calculateAverageFieldLengths = function () {
          for (
            var e = Object.keys(this.fieldLengths),
              n = e.length,
              r = {},
              i = {},
              s = 0;
            s < n;
            s++
          ) {
            var o = t.FieldRef.fromString(e[s]),
              a = o.fieldName;
            (i[a] || (i[a] = 0),
              (i[a] += 1),
              r[a] || (r[a] = 0),
              (r[a] += this.fieldLengths[o]));
          }
          for (var l = Object.keys(this._fields), s = 0; s < l.length; s++) {
            var u = l[s];
            r[u] = r[u] / i[u];
          }
          this.averageFieldLength = r;
        }),
        (t.Builder.prototype.createFieldVectors = function () {
          for (
            var e = {},
              n = Object.keys(this.fieldTermFrequencies),
              r = n.length,
              i = Object.create(null),
              s = 0;
            s < r;
            s++
          ) {
            for (
              var o = t.FieldRef.fromString(n[s]),
                a = o.fieldName,
                l = this.fieldLengths[o],
                u = new t.Vector(),
                d = this.fieldTermFrequencies[o],
                y = Object.keys(d),
                p = y.length,
                b = this._fields[a].boost || 1,
                g = this._documents[o.docRef].boost || 1,
                L = 0;
              L < p;
              L++
            ) {
              var f = y[L],
                m = d[f],
                S = this.invertedIndex[f]._index,
                w,
                k,
                _;
              (i[f] === void 0
                ? ((w = t.idf(this.invertedIndex[f], this.documentCount)),
                  (i[f] = w))
                : (w = i[f]),
                (k =
                  (w * ((this._k1 + 1) * m)) /
                  (this._k1 *
                    (1 - this._b + this._b * (l / this.averageFieldLength[a])) +
                    m)),
                (k *= b),
                (k *= g),
                (_ = Math.round(k * 1e3) / 1e3),
                u.insert(S, _));
            }
            e[o] = u;
          }
          this.fieldVectors = e;
        }),
        (t.Builder.prototype.createTokenSet = function () {
          this.tokenSet = t.TokenSet.fromArray(
            Object.keys(this.invertedIndex).sort()
          );
        }),
        (t.Builder.prototype.build = function () {
          return (
            this.calculateAverageFieldLengths(),
            this.createFieldVectors(),
            this.createTokenSet(),
            new t.Index({
              invertedIndex: this.invertedIndex,
              fieldVectors: this.fieldVectors,
              tokenSet: this.tokenSet,
              fields: Object.keys(this._fields),
              pipeline: this.searchPipeline,
            })
          );
        }),
        (t.Builder.prototype.use = function (e) {
          var n = Array.prototype.slice.call(arguments, 1);
          (n.unshift(this), e.apply(this, n));
        }),
        (t.MatchData = function (e, n, r) {
          for (
            var i = Object.create(null), s = Object.keys(r || {}), o = 0;
            o < s.length;
            o++
          ) {
            var a = s[o];
            i[a] = r[a].slice();
          }
          ((this.metadata = Object.create(null)),
            e !== void 0 &&
              ((this.metadata[e] = Object.create(null)),
              (this.metadata[e][n] = i)));
        }),
        (t.MatchData.prototype.combine = function (e) {
          for (var n = Object.keys(e.metadata), r = 0; r < n.length; r++) {
            var i = n[r],
              s = Object.keys(e.metadata[i]);
            this.metadata[i] == null &&
              (this.metadata[i] = Object.create(null));
            for (var o = 0; o < s.length; o++) {
              var a = s[o],
                l = Object.keys(e.metadata[i][a]);
              this.metadata[i][a] == null &&
                (this.metadata[i][a] = Object.create(null));
              for (var u = 0; u < l.length; u++) {
                var d = l[u];
                this.metadata[i][a][d] == null
                  ? (this.metadata[i][a][d] = e.metadata[i][a][d])
                  : (this.metadata[i][a][d] = this.metadata[i][a][d].concat(
                      e.metadata[i][a][d]
                    ));
              }
            }
          }
        }),
        (t.MatchData.prototype.add = function (e, n, r) {
          if (!(e in this.metadata)) {
            ((this.metadata[e] = Object.create(null)),
              (this.metadata[e][n] = r));
            return;
          }
          if (!(n in this.metadata[e])) {
            this.metadata[e][n] = r;
            return;
          }
          for (var i = Object.keys(r), s = 0; s < i.length; s++) {
            var o = i[s];
            o in this.metadata[e][n]
              ? (this.metadata[e][n][o] = this.metadata[e][n][o].concat(r[o]))
              : (this.metadata[e][n][o] = r[o]);
          }
        }),
        (t.Query = function (e) {
          ((this.clauses = []), (this.allFields = e));
        }),
        (t.Query.wildcard = new String('*')),
        (t.Query.wildcard.NONE = 0),
        (t.Query.wildcard.LEADING = 1),
        (t.Query.wildcard.TRAILING = 2),
        (t.Query.presence = { OPTIONAL: 1, REQUIRED: 2, PROHIBITED: 3 }),
        (t.Query.prototype.clause = function (e) {
          return (
            'fields' in e || (e.fields = this.allFields),
            'boost' in e || (e.boost = 1),
            'usePipeline' in e || (e.usePipeline = !0),
            'wildcard' in e || (e.wildcard = t.Query.wildcard.NONE),
            e.wildcard & t.Query.wildcard.LEADING &&
              e.term.charAt(0) != t.Query.wildcard &&
              (e.term = '*' + e.term),
            e.wildcard & t.Query.wildcard.TRAILING &&
              e.term.slice(-1) != t.Query.wildcard &&
              (e.term = '' + e.term + '*'),
            'presence' in e || (e.presence = t.Query.presence.OPTIONAL),
            this.clauses.push(e),
            this
          );
        }),
        (t.Query.prototype.isNegated = function () {
          for (var e = 0; e < this.clauses.length; e++)
            if (this.clauses[e].presence != t.Query.presence.PROHIBITED)
              return !1;
          return !0;
        }),
        (t.Query.prototype.term = function (e, n) {
          if (Array.isArray(e))
            return (
              e.forEach(function (i) {
                this.term(i, t.utils.clone(n));
              }, this),
              this
            );
          var r = n || {};
          return ((r.term = e.toString()), this.clause(r), this);
        }),
        (t.QueryParseError = function (e, n, r) {
          ((this.name = 'QueryParseError'),
            (this.message = e),
            (this.start = n),
            (this.end = r));
        }),
        (t.QueryParseError.prototype = new Error()),
        (t.QueryLexer = function (e) {
          ((this.lexemes = []),
            (this.str = e),
            (this.length = e.length),
            (this.pos = 0),
            (this.start = 0),
            (this.escapeCharPositions = []));
        }),
        (t.QueryLexer.prototype.run = function () {
          for (var e = t.QueryLexer.lexText; e; ) e = e(this);
        }),
        (t.QueryLexer.prototype.sliceString = function () {
          for (
            var e = [], n = this.start, r = this.pos, i = 0;
            i < this.escapeCharPositions.length;
            i++
          )
            ((r = this.escapeCharPositions[i]),
              e.push(this.str.slice(n, r)),
              (n = r + 1));
          return (
            e.push(this.str.slice(n, this.pos)),
            (this.escapeCharPositions.length = 0),
            e.join('')
          );
        }),
        (t.QueryLexer.prototype.emit = function (e) {
          (this.lexemes.push({
            type: e,
            str: this.sliceString(),
            start: this.start,
            end: this.pos,
          }),
            (this.start = this.pos));
        }),
        (t.QueryLexer.prototype.escapeCharacter = function () {
          (this.escapeCharPositions.push(this.pos - 1), (this.pos += 1));
        }),
        (t.QueryLexer.prototype.next = function () {
          if (this.pos >= this.length) return t.QueryLexer.EOS;
          var e = this.str.charAt(this.pos);
          return ((this.pos += 1), e);
        }),
        (t.QueryLexer.prototype.width = function () {
          return this.pos - this.start;
        }),
        (t.QueryLexer.prototype.ignore = function () {
          (this.start == this.pos && (this.pos += 1), (this.start = this.pos));
        }),
        (t.QueryLexer.prototype.backup = function () {
          this.pos -= 1;
        }),
        (t.QueryLexer.prototype.acceptDigitRun = function () {
          var e, n;
          do ((e = this.next()), (n = e.charCodeAt(0)));
          while (n > 47 && n < 58);
          e != t.QueryLexer.EOS && this.backup();
        }),
        (t.QueryLexer.prototype.more = function () {
          return this.pos < this.length;
        }),
        (t.QueryLexer.EOS = 'EOS'),
        (t.QueryLexer.FIELD = 'FIELD'),
        (t.QueryLexer.TERM = 'TERM'),
        (t.QueryLexer.EDIT_DISTANCE = 'EDIT_DISTANCE'),
        (t.QueryLexer.BOOST = 'BOOST'),
        (t.QueryLexer.PRESENCE = 'PRESENCE'),
        (t.QueryLexer.lexField = function (e) {
          return (
            e.backup(),
            e.emit(t.QueryLexer.FIELD),
            e.ignore(),
            t.QueryLexer.lexText
          );
        }),
        (t.QueryLexer.lexTerm = function (e) {
          if (
            (e.width() > 1 && (e.backup(), e.emit(t.QueryLexer.TERM)),
            e.ignore(),
            e.more())
          )
            return t.QueryLexer.lexText;
        }),
        (t.QueryLexer.lexEditDistance = function (e) {
          return (
            e.ignore(),
            e.acceptDigitRun(),
            e.emit(t.QueryLexer.EDIT_DISTANCE),
            t.QueryLexer.lexText
          );
        }),
        (t.QueryLexer.lexBoost = function (e) {
          return (
            e.ignore(),
            e.acceptDigitRun(),
            e.emit(t.QueryLexer.BOOST),
            t.QueryLexer.lexText
          );
        }),
        (t.QueryLexer.lexEOS = function (e) {
          e.width() > 0 && e.emit(t.QueryLexer.TERM);
        }),
        (t.QueryLexer.termSeparator = t.tokenizer.separator),
        (t.QueryLexer.lexText = function (e) {
          for (;;) {
            var n = e.next();
            if (n == t.QueryLexer.EOS) return t.QueryLexer.lexEOS;
            if (n.charCodeAt(0) == 92) {
              e.escapeCharacter();
              continue;
            }
            if (n == ':') return t.QueryLexer.lexField;
            if (n == '~')
              return (
                e.backup(),
                e.width() > 0 && e.emit(t.QueryLexer.TERM),
                t.QueryLexer.lexEditDistance
              );
            if (n == '^')
              return (
                e.backup(),
                e.width() > 0 && e.emit(t.QueryLexer.TERM),
                t.QueryLexer.lexBoost
              );
            if ((n == '+' && e.width() === 1) || (n == '-' && e.width() === 1))
              return (e.emit(t.QueryLexer.PRESENCE), t.QueryLexer.lexText);
            if (n.match(t.QueryLexer.termSeparator))
              return t.QueryLexer.lexTerm;
          }
        }),
        (t.QueryParser = function (e, n) {
          ((this.lexer = new t.QueryLexer(e)),
            (this.query = n),
            (this.currentClause = {}),
            (this.lexemeIdx = 0));
        }),
        (t.QueryParser.prototype.parse = function () {
          (this.lexer.run(), (this.lexemes = this.lexer.lexemes));
          for (var e = t.QueryParser.parseClause; e; ) e = e(this);
          return this.query;
        }),
        (t.QueryParser.prototype.peekLexeme = function () {
          return this.lexemes[this.lexemeIdx];
        }),
        (t.QueryParser.prototype.consumeLexeme = function () {
          var e = this.peekLexeme();
          return ((this.lexemeIdx += 1), e);
        }),
        (t.QueryParser.prototype.nextClause = function () {
          var e = this.currentClause;
          (this.query.clause(e), (this.currentClause = {}));
        }),
        (t.QueryParser.parseClause = function (e) {
          var n = e.peekLexeme();
          if (n != null)
            switch (n.type) {
              case t.QueryLexer.PRESENCE:
                return t.QueryParser.parsePresence;
              case t.QueryLexer.FIELD:
                return t.QueryParser.parseField;
              case t.QueryLexer.TERM:
                return t.QueryParser.parseTerm;
              default:
                var r = 'expected either a field or a term, found ' + n.type;
                throw (
                  n.str.length >= 1 && (r += " with value '" + n.str + "'"),
                  new t.QueryParseError(r, n.start, n.end)
                );
            }
        }),
        (t.QueryParser.parsePresence = function (e) {
          var n = e.consumeLexeme();
          if (n != null) {
            switch (n.str) {
              case '-':
                e.currentClause.presence = t.Query.presence.PROHIBITED;
                break;
              case '+':
                e.currentClause.presence = t.Query.presence.REQUIRED;
                break;
              default:
                var r = "unrecognised presence operator'" + n.str + "'";
                throw new t.QueryParseError(r, n.start, n.end);
            }
            var i = e.peekLexeme();
            if (i == null) {
              var r = 'expecting term or field, found nothing';
              throw new t.QueryParseError(r, n.start, n.end);
            }
            switch (i.type) {
              case t.QueryLexer.FIELD:
                return t.QueryParser.parseField;
              case t.QueryLexer.TERM:
                return t.QueryParser.parseTerm;
              default:
                var r = "expecting term or field, found '" + i.type + "'";
                throw new t.QueryParseError(r, i.start, i.end);
            }
          }
        }),
        (t.QueryParser.parseField = function (e) {
          var n = e.consumeLexeme();
          if (n != null) {
            if (e.query.allFields.indexOf(n.str) == -1) {
              var r = e.query.allFields
                  .map(function (o) {
                    return "'" + o + "'";
                  })
                  .join(', '),
                i = "unrecognised field '" + n.str + "', possible fields: " + r;
              throw new t.QueryParseError(i, n.start, n.end);
            }
            e.currentClause.fields = [n.str];
            var s = e.peekLexeme();
            if (s == null) {
              var i = 'expecting term, found nothing';
              throw new t.QueryParseError(i, n.start, n.end);
            }
            switch (s.type) {
              case t.QueryLexer.TERM:
                return t.QueryParser.parseTerm;
              default:
                var i = "expecting term, found '" + s.type + "'";
                throw new t.QueryParseError(i, s.start, s.end);
            }
          }
        }),
        (t.QueryParser.parseTerm = function (e) {
          var n = e.consumeLexeme();
          if (n != null) {
            ((e.currentClause.term = n.str.toLowerCase()),
              n.str.indexOf('*') != -1 && (e.currentClause.usePipeline = !1));
            var r = e.peekLexeme();
            if (r == null) {
              e.nextClause();
              return;
            }
            switch (r.type) {
              case t.QueryLexer.TERM:
                return (e.nextClause(), t.QueryParser.parseTerm);
              case t.QueryLexer.FIELD:
                return (e.nextClause(), t.QueryParser.parseField);
              case t.QueryLexer.EDIT_DISTANCE:
                return t.QueryParser.parseEditDistance;
              case t.QueryLexer.BOOST:
                return t.QueryParser.parseBoost;
              case t.QueryLexer.PRESENCE:
                return (e.nextClause(), t.QueryParser.parsePresence);
              default:
                var i = "Unexpected lexeme type '" + r.type + "'";
                throw new t.QueryParseError(i, r.start, r.end);
            }
          }
        }),
        (t.QueryParser.parseEditDistance = function (e) {
          var n = e.consumeLexeme();
          if (n != null) {
            var r = parseInt(n.str, 10);
            if (isNaN(r)) {
              var i = 'edit distance must be numeric';
              throw new t.QueryParseError(i, n.start, n.end);
            }
            e.currentClause.editDistance = r;
            var s = e.peekLexeme();
            if (s == null) {
              e.nextClause();
              return;
            }
            switch (s.type) {
              case t.QueryLexer.TERM:
                return (e.nextClause(), t.QueryParser.parseTerm);
              case t.QueryLexer.FIELD:
                return (e.nextClause(), t.QueryParser.parseField);
              case t.QueryLexer.EDIT_DISTANCE:
                return t.QueryParser.parseEditDistance;
              case t.QueryLexer.BOOST:
                return t.QueryParser.parseBoost;
              case t.QueryLexer.PRESENCE:
                return (e.nextClause(), t.QueryParser.parsePresence);
              default:
                var i = "Unexpected lexeme type '" + s.type + "'";
                throw new t.QueryParseError(i, s.start, s.end);
            }
          }
        }),
        (t.QueryParser.parseBoost = function (e) {
          var n = e.consumeLexeme();
          if (n != null) {
            var r = parseInt(n.str, 10);
            if (isNaN(r)) {
              var i = 'boost must be numeric';
              throw new t.QueryParseError(i, n.start, n.end);
            }
            e.currentClause.boost = r;
            var s = e.peekLexeme();
            if (s == null) {
              e.nextClause();
              return;
            }
            switch (s.type) {
              case t.QueryLexer.TERM:
                return (e.nextClause(), t.QueryParser.parseTerm);
              case t.QueryLexer.FIELD:
                return (e.nextClause(), t.QueryParser.parseField);
              case t.QueryLexer.EDIT_DISTANCE:
                return t.QueryParser.parseEditDistance;
              case t.QueryLexer.BOOST:
                return t.QueryParser.parseBoost;
              case t.QueryLexer.PRESENCE:
                return (e.nextClause(), t.QueryParser.parsePresence);
              default:
                var i = "Unexpected lexeme type '" + s.type + "'";
                throw new t.QueryParseError(i, s.start, s.end);
            }
          }
        }),
        (function (e, n) {
          typeof define == 'function' && define.amd
            ? define(n)
            : typeof se == 'object'
              ? (oe.exports = n())
              : (e.lunr = n());
        })(this, function () {
          return t;
        }));
    })();
  });
  var re = [];
  function G(t, e) {
    re.push({ selector: e, constructor: t });
  }
  var U = class {
    constructor() {
      this.alwaysVisibleMember = null;
      (this.createComponents(document.body),
        this.ensureFocusedElementVisible(),
        this.listenForCodeCopies(),
        window.addEventListener('hashchange', () =>
          this.ensureFocusedElementVisible()
        ),
        document.body.style.display ||
          (this.ensureFocusedElementVisible(),
          this.updateIndexVisibility(),
          this.scrollToHash()));
    }
    createComponents(e) {
      re.forEach(n => {
        e.querySelectorAll(n.selector).forEach(r => {
          r.dataset.hasInstance ||
            (new n.constructor({ el: r, app: this }),
            (r.dataset.hasInstance = String(!0)));
        });
      });
    }
    filterChanged() {
      this.ensureFocusedElementVisible();
    }
    showPage() {
      document.body.style.display &&
        (console.log('Show page'),
        document.body.style.removeProperty('display'),
        this.ensureFocusedElementVisible(),
        this.updateIndexVisibility(),
        this.scrollToHash());
    }
    scrollToHash() {
      if (location.hash) {
        console.log('Scorlling');
        let e = document.getElementById(location.hash.substring(1));
        if (!e) return;
        e.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
    ensureActivePageVisible() {
      let e = document.querySelector('.tsd-navigation .current'),
        n = e?.parentElement;
      for (; n && !n.classList.contains('.tsd-navigation'); )
        (n instanceof HTMLDetailsElement && (n.open = !0),
          (n = n.parentElement));
      if (e && !e.checkVisibility()) {
        let r =
          e.getBoundingClientRect().top -
          document.documentElement.clientHeight / 4;
        document.querySelector('.site-menu').scrollTop = r;
      }
    }
    updateIndexVisibility() {
      let e = document.querySelector('.tsd-index-content'),
        n = e?.open;
      (e && (e.open = !0),
        document.querySelectorAll('.tsd-index-section').forEach(r => {
          r.style.display = 'block';
          let i = Array.from(r.querySelectorAll('.tsd-index-link')).every(
            s => s.offsetParent == null
          );
          r.style.display = i ? 'none' : 'block';
        }),
        e && (e.open = n));
    }
    ensureFocusedElementVisible() {
      if (
        (this.alwaysVisibleMember &&
          (this.alwaysVisibleMember.classList.remove('always-visible'),
          this.alwaysVisibleMember.firstElementChild.remove(),
          (this.alwaysVisibleMember = null)),
        !location.hash)
      )
        return;
      let e = document.getElementById(location.hash.substring(1));
      if (!e) return;
      let n = e.parentElement;
      for (; n && n.tagName !== 'SECTION'; ) n = n.parentElement;
      if (n && n.offsetParent == null) {
        ((this.alwaysVisibleMember = n), n.classList.add('always-visible'));
        let r = document.createElement('p');
        (r.classList.add('warning'),
          (r.textContent =
            'This member is normally hidden due to your filter settings.'),
          n.prepend(r));
      }
    }
    listenForCodeCopies() {
      document.querySelectorAll('pre > button').forEach(e => {
        let n;
        e.addEventListener('click', () => {
          (e.previousElementSibling instanceof HTMLElement &&
            navigator.clipboard.writeText(
              e.previousElementSibling.innerText.trim()
            ),
            (e.textContent = 'Copied!'),
            e.classList.add('visible'),
            clearTimeout(n),
            (n = setTimeout(() => {
              (e.classList.remove('visible'),
                (n = setTimeout(() => {
                  e.textContent = 'Copy';
                }, 100)));
            }, 1e3)));
        });
      });
    }
  };
  var ie = (t, e = 100) => {
    let n;
    return () => {
      (clearTimeout(n), (n = setTimeout(() => t(), e)));
    };
  };
  var de = De(ae());
  async function le(t, e) {
    if (!window.searchData) return;
    let n = await fetch(window.searchData),
      r = new Blob([await n.arrayBuffer()])
        .stream()
        .pipeThrough(new DecompressionStream('gzip')),
      i = await new Response(r).json();
    ((t.data = i),
      (t.index = de.Index.load(i.index)),
      e.classList.remove('loading'),
      e.classList.add('ready'));
  }
  function he() {
    let t = document.getElementById('tsd-search');
    if (!t) return;
    let e = { base: t.dataset.base + '/' },
      n = document.getElementById('tsd-search-script');
    (t.classList.add('loading'),
      n &&
        (n.addEventListener('error', () => {
          (t.classList.remove('loading'), t.classList.add('failure'));
        }),
        n.addEventListener('load', () => {
          le(e, t);
        }),
        le(e, t)));
    let r = document.querySelector('#tsd-search input'),
      i = document.querySelector('#tsd-search .results');
    if (!r || !i)
      throw new Error(
        'The input field or the result list wrapper was not found'
      );
    let s = !1;
    (i.addEventListener('mousedown', () => (s = !0)),
      i.addEventListener('mouseup', () => {
        ((s = !1), t.classList.remove('has-focus'));
      }),
      r.addEventListener('focus', () => t.classList.add('has-focus')),
      r.addEventListener('blur', () => {
        s || ((s = !1), t.classList.remove('has-focus'));
      }),
      Ae(t, i, r, e));
  }
  function Ae(t, e, n, r) {
    n.addEventListener(
      'input',
      ie(() => {
        Ve(t, e, n, r);
      }, 200)
    );
    let i = !1;
    (n.addEventListener('keydown', s => {
      ((i = !0),
        s.key == 'Enter'
          ? Ne(e, n)
          : s.key == 'Escape'
            ? n.blur()
            : s.key == 'ArrowUp'
              ? ue(e, -1)
              : s.key === 'ArrowDown'
                ? ue(e, 1)
                : (i = !1));
    }),
      n.addEventListener('keypress', s => {
        i && s.preventDefault();
      }),
      document.body.addEventListener('keydown', s => {
        s.altKey ||
          s.ctrlKey ||
          s.metaKey ||
          (!n.matches(':focus') &&
            s.key === '/' &&
            (n.focus(), s.preventDefault()));
      }));
  }
  function Ve(t, e, n, r) {
    if (!r.index || !r.data) return;
    e.textContent = '';
    let i = n.value.trim(),
      s;
    if (i) {
      let o = i
        .split(' ')
        .map(a => (a.length ? `*${a}*` : ''))
        .join(' ');
      s = r.index.search(o);
    } else s = [];
    for (let o = 0; o < s.length; o++) {
      let a = s[o],
        l = r.data.rows[Number(a.ref)],
        u = 1;
      (l.name.toLowerCase().startsWith(i.toLowerCase()) &&
        (u *= 1 + 1 / (1 + Math.abs(l.name.length - i.length))),
        (a.score *= u));
    }
    if (s.length === 0) {
      let o = document.createElement('li');
      o.classList.add('no-results');
      let a = document.createElement('span');
      ((a.textContent = 'No results found'),
        o.appendChild(a),
        e.appendChild(o));
    }
    s.sort((o, a) => a.score - o.score);
    for (let o = 0, a = Math.min(10, s.length); o < a; o++) {
      let l = r.data.rows[Number(s[o].ref)],
        u = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="tsd-kind-icon"><use href="#icon-${l.kind}"></use></svg>`,
        d = ce(l.name, i);
      (globalThis.DEBUG_SEARCH_WEIGHTS &&
        (d += ` (score: ${s[o].score.toFixed(2)})`),
        l.parent &&
          (d = `<span class="parent">
                ${ce(l.parent, i)}.</span>${d}`));
      let y = document.createElement('li');
      y.classList.value = l.classes ?? '';
      let p = document.createElement('a');
      ((p.href = r.base + l.url),
        (p.innerHTML = u + d),
        y.append(p),
        e.appendChild(y));
    }
  }
  function ue(t, e) {
    let n = t.querySelector('.current');
    if (!n)
      ((n = t.querySelector(e == 1 ? 'li:first-child' : 'li:last-child')),
        n && n.classList.add('current'));
    else {
      let r = n;
      if (e === 1)
        do r = r.nextElementSibling ?? void 0;
        while (r instanceof HTMLElement && r.offsetParent == null);
      else
        do r = r.previousElementSibling ?? void 0;
        while (r instanceof HTMLElement && r.offsetParent == null);
      r && (n.classList.remove('current'), r.classList.add('current'));
    }
  }
  function Ne(t, e) {
    let n = t.querySelector('.current');
    if ((n || (n = t.querySelector('li:first-child')), n)) {
      let r = n.querySelector('a');
      (r && (window.location.href = r.href), e.blur());
    }
  }
  function ce(t, e) {
    if (e === '') return t;
    let n = t.toLocaleLowerCase(),
      r = e.toLocaleLowerCase(),
      i = [],
      s = 0,
      o = n.indexOf(r);
    for (; o != -1; )
      (i.push(
        K(t.substring(s, o)),
        `<b>${K(t.substring(o, o + r.length))}</b>`
      ),
        (s = o + r.length),
        (o = n.indexOf(r, s)));
    return (i.push(K(t.substring(s))), i.join(''));
  }
  var He = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  };
  function K(t) {
    return t.replace(/[&<>"'"]/g, e => He[e]);
  }
  var I = class {
    constructor(e) {
      ((this.el = e.el), (this.app = e.app));
    }
  };
  var F = 'mousedown',
    fe = 'mousemove',
    H = 'mouseup',
    J = { x: 0, y: 0 },
    pe = !1,
    ee = !1,
    Be = !1,
    D = !1,
    me = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  document.documentElement.classList.add(me ? 'is-mobile' : 'not-mobile');
  me &&
    'ontouchstart' in document.documentElement &&
    ((Be = !0), (F = 'touchstart'), (fe = 'touchmove'), (H = 'touchend'));
  document.addEventListener(F, t => {
    ((ee = !0), (D = !1));
    let e = F == 'touchstart' ? t.targetTouches[0] : t;
    ((J.y = e.pageY || 0), (J.x = e.pageX || 0));
  });
  document.addEventListener(fe, t => {
    if (ee && !D) {
      let e = F == 'touchstart' ? t.targetTouches[0] : t,
        n = J.x - (e.pageX || 0),
        r = J.y - (e.pageY || 0);
      D = Math.sqrt(n * n + r * r) > 10;
    }
  });
  document.addEventListener(H, () => {
    ee = !1;
  });
  document.addEventListener('click', t => {
    pe && (t.preventDefault(), t.stopImmediatePropagation(), (pe = !1));
  });
  var X = class extends I {
    constructor(e) {
      (super(e),
        (this.className = this.el.dataset.toggle || ''),
        this.el.addEventListener(H, n => this.onPointerUp(n)),
        this.el.addEventListener('click', n => n.preventDefault()),
        document.addEventListener(F, n => this.onDocumentPointerDown(n)),
        document.addEventListener(H, n => this.onDocumentPointerUp(n)));
    }
    setActive(e) {
      if (this.active == e) return;
      ((this.active = e),
        document.documentElement.classList.toggle('has-' + this.className, e),
        this.el.classList.toggle('active', e));
      let n = (this.active ? 'to-has-' : 'from-has-') + this.className;
      (document.documentElement.classList.add(n),
        setTimeout(() => document.documentElement.classList.remove(n), 500));
    }
    onPointerUp(e) {
      D || (this.setActive(!0), e.preventDefault());
    }
    onDocumentPointerDown(e) {
      if (this.active) {
        if (e.target.closest('.col-sidebar, .tsd-filter-group')) return;
        this.setActive(!1);
      }
    }
    onDocumentPointerUp(e) {
      if (!D && this.active && e.target.closest('.col-sidebar')) {
        let n = e.target.closest('a');
        if (n) {
          let r = window.location.href;
          (r.indexOf('#') != -1 && (r = r.substring(0, r.indexOf('#'))),
            n.href.substring(0, r.length) == r &&
              setTimeout(() => this.setActive(!1), 250));
        }
      }
    }
  };
  var te;
  try {
    te = localStorage;
  } catch {
    te = {
      getItem() {
        return null;
      },
      setItem() {},
    };
  }
  var Q = te;
  var ye = document.head.appendChild(document.createElement('style'));
  ye.dataset.for = 'filters';
  var Y = class extends I {
    constructor(e) {
      (super(e),
        (this.key = `filter-${this.el.name}`),
        (this.value = this.el.checked),
        this.el.addEventListener('change', () => {
          this.setLocalStorage(this.el.checked);
        }),
        this.setLocalStorage(this.fromLocalStorage()),
        (ye.innerHTML += `html:not(.${this.key}) .tsd-is-${this.el.name} { display: none; }
`),
        this.app.updateIndexVisibility());
    }
    fromLocalStorage() {
      let e = Q.getItem(this.key);
      return e ? e === 'true' : this.el.checked;
    }
    setLocalStorage(e) {
      (Q.setItem(this.key, e.toString()),
        (this.value = e),
        this.handleValueChange());
    }
    handleValueChange() {
      ((this.el.checked = this.value),
        document.documentElement.classList.toggle(this.key, this.value),
        this.app.filterChanged(),
        this.app.updateIndexVisibility());
    }
  };
  var Z = class extends I {
    constructor(e) {
      (super(e),
        (this.summary = this.el.querySelector('.tsd-accordion-summary')),
        (this.icon = this.summary.querySelector('svg')),
        (this.key = `tsd-accordion-${this.summary.dataset.key ?? this.summary.textContent.trim().replace(/\s+/g, '-').toLowerCase()}`));
      let n = Q.getItem(this.key);
      ((this.el.open = n ? n === 'true' : this.el.open),
        this.el.addEventListener('toggle', () => this.update()));
      let r = this.summary.querySelector('a');
      (r &&
        r.addEventListener('click', () => {
          location.assign(r.href);
        }),
        this.update());
    }
    update() {
      ((this.icon.style.transform = `rotate(${this.el.open ? 0 : -90}deg)`),
        Q.setItem(this.key, this.el.open.toString()));
    }
  };
  function ge(t) {
    let e = Q.getItem('tsd-theme') || 'os';
    ((t.value = e),
      ve(e),
      t.addEventListener('change', () => {
        (Q.setItem('tsd-theme', t.value), ve(t.value));
      }));
  }
  function ve(t) {
    document.documentElement.dataset.theme = t;
  }
  var Le;
  function be() {
    let t = document.getElementById('tsd-nav-script');
    t && (t.addEventListener('load', xe), xe());
  }
  async function xe() {
    let t = document.getElementById('tsd-nav-container');
    if (!t || !window.navigationData) return;
    let n = await (await fetch(window.navigationData)).arrayBuffer(),
      r = new Blob([n]).stream().pipeThrough(new DecompressionStream('gzip')),
      i = await new Response(r).json();
    ((Le = t.dataset.base + '/'), (t.innerHTML = ''));
    for (let s of i) we(s, t, []);
    (window.app.createComponents(t),
      window.app.showPage(),
      window.app.ensureActivePageVisible());
  }
  function we(t, e, n) {
    let r = e.appendChild(document.createElement('li'));
    if (t.children) {
      let i = [...n, t.text],
        s = r.appendChild(document.createElement('details'));
      ((s.className = t.class
        ? `${t.class} tsd-index-accordion`
        : 'tsd-index-accordion'),
        (s.dataset.key = i.join('$')));
      let o = s.appendChild(document.createElement('summary'));
      ((o.className = 'tsd-accordion-summary'),
        (o.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><use href="#icon-chevronDown"></use></svg>'),
        Ee(t, o));
      let a = s.appendChild(document.createElement('div'));
      a.className = 'tsd-accordion-details';
      let l = a.appendChild(document.createElement('ul'));
      l.className = 'tsd-nested-navigation';
      for (let u of t.children) we(u, l, i);
    } else Ee(t, r, t.class);
  }
  function Ee(t, e, n) {
    if (t.path) {
      let r = e.appendChild(document.createElement('a'));
      ((r.href = Le + t.path),
        n && (r.className = n),
        location.pathname === r.pathname && r.classList.add('current'),
        t.kind &&
          (r.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="tsd-kind-icon"><use href="#icon-${t.kind}"></use></svg>`),
        (r.appendChild(document.createElement('span')).textContent = t.text));
    } else e.appendChild(document.createElement('span')).textContent = t.text;
  }
  G(X, 'a[data-toggle]');
  G(Z, '.tsd-index-accordion');
  G(Y, '.tsd-filter-item input[type=checkbox]');
  var Se = document.getElementById('tsd-theme');
  Se && ge(Se);
  var je = new U();
  Object.defineProperty(window, 'app', { value: je });
  he();
  be();
})();
/*! Bundled license information:

lunr/lunr.js:
  (**
   * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.9
   * Copyright (C) 2020 Oliver Nightingale
   * @license MIT
   *)
  (*!
   * lunr.utils
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.Set
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.tokenizer
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.Pipeline
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.Vector
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.stemmer
   * Copyright (C) 2020 Oliver Nightingale
   * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
   *)
  (*!
   * lunr.stopWordFilter
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.trimmer
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.TokenSet
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.Index
   * Copyright (C) 2020 Oliver Nightingale
   *)
  (*!
   * lunr.Builder
   * Copyright (C) 2020 Oliver Nightingale
   *)
*/
