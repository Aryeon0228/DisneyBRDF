# Penumbra Light Lab

기존 Disney BRDF 뷰어에 추가한 한국어 라이팅 튜토리얼입니다.

- 시작 페이지: `lighting-lab.html`
- 촛불·보름달·백열등·전구형 형광등(CFL)·햇빛 중 두 조명 선택
- 데스크톱 드래그 앤 드롭, 모바일·키보드용 배치 버튼 및 선택 상자
- 두 비교칸에서 독립적인 개수·거리 또는 측정면 조도 조절
- 동일 카메라 노출 및 장면별 자동 노출 비교
- 분석적으로 계산한 확산 구·평면. 광원의 직접 발광, 간접광, 엔진별 EV100 모사는 제외
- 백열등·CFL은 모두 800 lm, 전방향 점광원·정면 1m 기준 약 63.66 lx
- 달빛은 보름달의 지면 예시 0.2 lx. 조도 계산 가정 및 참고 자료는 페이지 하단에 표시

별도 설치나 외부 라이브러리 없이 정적 서버에서 작동합니다. 기존 BRDF 페이지의 외부 의존성은 유지했습니다.

## 검증 및 배포용 파일

`node build-site.mjs` — 25개 조명 조합의 수치 계산·노출 보정, 잘못된 입력, 페이지 참조와 이미지 파일 검증 후 `dist/`에 정적 결과물을 만듭니다.

`node test-light-ui.mjs` — 실제 UI 이벤트 함수를 브라우저 없는 DOM 대역에서 실행합니다. 드롭, 클릭 배치, 거리, 취소, 잘못된 드롭 데이터, 광원 교체 시 초기화 및 전체 초기화를 검증합니다.

지원 브라우저의 WebMCP 컨텍스트에서 달빛·형광등 선택과 거리, 독립 노출, 백열등·형광등의 동일 조도, 잘못된 조합 거부와 거부 후 상태 유지를 검증했습니다. 네이티브 브라우저 드래그 제스처 및 기기별 시각 검증은 수행하지 않았습니다.

배포 파일은 `dist/` 전체입니다. `assets/`와 `light-sources.mjs`를 포함해야 합니다. 그림 제작 기록은 `LIGHT-ART.md`에 있습니다.

## 메뉴와 상대적인 색감

- ‘조명 실험’과 ‘원리와 설명’ 탭으로 조절 UI와 교육 내용을 분리했습니다.
- 개별 광원 설정은 해당 뷰 아래, 공통 노출·흰색 기준은 뷰 위에 배치했습니다.
- 중립 / 왼쪽 / 오른쪽 흰색 기준을 양쪽 렌더에 동일하게 적용합니다.
- 선형 RGB 채널 보정 후 휘도를 정규화하는 교육용 화이트밸런스 근사입니다. 실제 스펙트럼이나 완전한 색 외관 모델이 아닙니다.
- 달빛에는 연출용으로 은은한 시안 RGB를 적용했습니다. 실제 암순응·동시 색 대비·시간에 따른 시각 적응은 재현하지 않습니다.
- 수치 검증: 기준광의 중립화, 촛불 기준에서 햇빛의 청색 증가, 양쪽 휘도 정규화, 색 끄기, 잘못된 기준 거부.
- UI 대역 검증: 기준 선택, 색 끄기, 탭 이동·키보드 이동·설명 바로가기 및 초기화.
- 지원 브라우저의 WebMCP에서 촛불/햇빛의 상대적 색 변화, 달빛의 시안 기본값, 잘못된 기준 거부 및 상태 유지까지 확인했습니다.


## Sketch layout and additive exposure

The render pair comes first, followed by shared brightness, white balance, source cards, source-specific measurement controls, and shared reflectance. Explanations remain in their own tab.

Final exposure per pane = base exposure + common brightness + per-pane offset. Base exposure is zero in shared mode and `fitExposure(lux)` in automatic mode. Common brightness remains enabled in both modes; manual offsets range from −24 to +24 stops. Entering auto via the UI starts from neutral corrections; matching exposures or fitting to one pane clears both manual offsets. A single-pane reset clears only that pane's offset. Source changes retain camera corrections.

WebMCP `exposureStops` always controls common brightness. `leftExposureOffset` / `rightExposureOffset` control manual offsets; omitted configuration fields are preserved. Results include commonExposure, exposureOffsets, and final per-pane exposure.


## Source count illustrations and daylight environments

Source illustrations appear beside the physical settings heading, white-balance labels and lux scale labels. Point-source controls display exactly one icon per source, up to 100, inside a bounded scrollable grid. The grid is decorative with a single accessible count label; source changes update the illustration and reset source count using existing preset behavior.

Six daylight environment cards use code-native inline SVG illustrations and receiving-surface example lux: direct sun 100000, outdoor shade 10000, overcast 5000, rainy 1000, indoors 100, dim indoors 10. They apply on either side when sunlight is selected and update the existing lux slider. Manual values outside presets clear selection. No weather-based hue or shadow changes are modeled. Overcast daylight context: https://www.open.edu/openlearn/nature-environment/energy-buildings/content-section-5.2.3 ; magnitude context: https://www.canada.ca/en/conservation-institute/services/agents-deterioration/light.html . Rain and indoor choices are explicit teaching scenarios, not weather measurements or standards.


## Human-scale distance guide

Below each point-source distance slider, an SVG ruler compares the source position with a 170 cm person. Both axes use the same fixed scale (40 SVG units per metre); the person is 68 units high and the 0–10 m ruler spans 400 units. The source point moves linearly with physical distance even though the slider itself is logarithmic. The light icon is a symbolic callout above the source point so 0.1 m remains legible; its artwork is not a physical size reference. A small receiving plane by the person's hand is the distance origin. Multiple sources share that distance, as in the illuminance model. Sun/moon controls do not show this point-source distance diagram. Narrow screens stack source settings so the guide stays legible.


## Comparison workbench layout

Physical count/distance/lux and daylight choices now sit directly beneath the corresponding live render. Quick count buttons offer 1, 3, 10, 30, 50 and 100 sources using the same state as the count slider. The single render pair and ratio remain sticky within the experiment while users adjust controls below; at very short viewport heights stickiness is disabled to avoid covering the available space. Render height is bounded by viewport height. No duplicate canvases or parallel control states were added.

Count illustrations and the human-scale distance guide live in native disclosure panels. Per-pane exposure has its own disclosure with the current correction visible when collapsed. Global brightness, white balance and drag source library remain below the primary source controls. Individual cards size to their own content so a moonlight control no longer stretches to the size of a neighbor's distance illustration.


## Moonlight and perception guide

The explanation tab now separates atmospheric yellowing of the lunar disk, the Purkinje shift in relative brightness sensitivity, rod–cone contributions to bluish impressions, and the lab's art-directed cyan. Claims link inline to NASA's moon illusion and moon phases pages, Stuart Anstis (2002, Vision Research; author-hosted UCSD PDF), and the 2009 Nature Neuroscience macaque-retina paper (PMC2789108). The retinal study is identified as a possible mechanism rather than a universal explanation of human moonlight perception. No physiology simulation was added.


## Window-room experiment

A third top-level tab places outdoor sun/moon and indoor candle/bulbs in the same educational room. The left view has window light only; the right adds a local source. Shared exposure is fixed until the user changes it or explicitly fits both views to one contribution. Initial values are outside 100000 lx × receiving fraction 0.003% = 3 lx, plus a candle at 1 m = 1 lx, with shared exposure fitted once to 4 lx. This is a dim interior teaching scenario, not a typical daytime indoor value. The bright-window shortcut retains the original 1000 lx scenario. Weak-window shortcut uses 0.001%, yielding 1 lx so the same candle doubles illuminance. Room controls do not mutate the existing independent light-comparison experiment.

`room-physics.mjs` validates updates atomically and computes receiving-plane contributions. Zero baselines return null ratios and no division-by-zero output. `room-renderer.mjs` traces a fixed room/window/block and samples the measured front face, adds daylight and local light in linear space, then applies identical reflectance/exposure/tone mapping. Window direction/mask is fixed; a small soft-window component approximates scattered light. The marked patch uses its center's illuminance uniformly. Window-surface brightness is illustrative. The receiving fraction combines geometry/shading effects and is explicitly not glass transmittance or a daylight-factor calculation. It is not an architectural daylight solver or a flame luminance model. No student artwork is uploaded or embedded.

WebMCP `configure_window_room` supports outdoor source/lux, reach, local source/count/distance, switches, shared exposure and color. It opens the room tab after a valid update and returns both contributions, sum, increase and source share. Run `node test-room.mjs` for photometry and receiving-pixel checks, `node test-light-ui.mjs` for controls/tab isolation, and `node build-site.mjs` to package the static runtime.

## Shared room orbit

Drag either room with mouse, pen or touch to orbit both cameras together; focused canvases also support arrow keys and Home. A view-only reset preserves all light settings. Yaw wraps for a complete turn, pitch stays above the floor, and near outer walls are omitted as a cutaway. The fixed reference patch has a projected outline, dashed with an explicit opposite-side label when occluded by the block. Rotation does not change photometry, light directions or receiver position. Drag rendering uses 240×160 and returns to 480×320 on release or cancellation. Common exposure now appears immediately before the two light-settings cards.

## Candle-readable start and optional bloom

The window remains bright while its receiving-plane contribution is reduced for the opening comparison. Both panes use the same exposure and optional bloom. Rendering stores exposed linear RGB before a bounded highlight extraction (threshold 1, excess capped at 2), two separable blurs, and addition at 0.08 strength, followed by Reinhard tone mapping and sRGB conversion. These are artistic postprocessing settings, not lux thresholds or an HDR display mode. Bright-room settings and a bloom-off comparison remain available. Lux outputs do not include the camera glow; labels and measurement outlines are drawn after postprocessing.
