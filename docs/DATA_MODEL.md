# 개념 데이터 모델

문서 상태: Draft v0.2

Phase 1의 실제 테이블, 키와 인덱스는 `D1_SCHEMA.md`를 따른다. 이 문서는 Phase 2 이후를 포함한 개념 모델을 설명한다.

## 1. 핵심 관계

```text
Source
  └─ Candidate
       └─ AnimationEntry
            ├─ CodePackageVersion
            ├─ TagAssignment
            ├─ CollectionMembership
            ├─ PracticeKit
            ├─ Tutorial
            ├─ ValidationRun
            └─ ReviewDecision
```

## 2. 엔터티

### Source

수집 출처 또는 원본 위치다.

- id
- type: codepen, website, directory, submission
- url
- canonicalUrl
- creatorName
- license
- discoveredVia
- firstSeenAt
- lastCheckedAt
- availability

`discoveredVia`와 `canonicalUrl`을 분리한다. WSSS에서 발견한 CodePen은 WSSS가 발견 경로이고 CodePen이 canonical source다.

### Candidate

아직 공개되지 않은 수집 항목이다.

- id
- sourceId
- status
- sourceTitle
- sourceCategory
- extractedMetadata
- deduplicationKey
- confidence
- priorityScore
- failureReason
- retryCount
- createdAt
- updatedAt

### AnimationEntry

사용자가 탐색하는 공개 콘텐츠의 중심 엔터티다.

- id
- slug
- title
- originalTitle
- summary
- contentOrigin: original-pen, lab-created
- status
- difficulty
- featured
- publishedAt
- updatedAt
- activeCodePackageVersionId
- sourceId

### CodePackageVersion

실행 가능한 코드의 변경 이력을 보관한다.

- id
- animationEntryId
- version
- html
- css
- javascript
- externalScripts
- externalStyles
- assets
- viewport
- interactionInstructions
- runtimePolicy
- createdBy: imported, agent, admin
- createdAt

내부 실행형 공개 콘텐츠는 언제나 하나의 활성 버전을 가진다. 원본 CodePen을 직접 실행하는 Phase 1 콘텐츠는 활성 CodePenRef가 이를 대신한다. 새 내부 버전이 검증에 실패하면 기존 공개 버전을 유지한다.

### Tag

- id
- axis: technology, trigger, motion, section, technique, difficulty, mood
- key
- labelKo
- labelEn
- aliases
- active

### TagAssignment

- animationEntryId
- tagId
- source: imported, inferred, admin
- confidence
- confirmed

### Pattern

유사한 구현 원리를 공유하는 예제 그룹이다.

- id
- slug
- title
- summary
- definingTraits

### Collection

운영자가 선별하거나 조건으로 자동 생성한 콘텐츠 묶음이다.

- id
- slug
- title
- description
- type: curated, dynamic
- filterDefinition
- featured

### PracticeKit

- id
- animationEntryId
- starterCodePackageVersionId
- mode: free, guided
- missions
- hints
- solutionVersionId
- status

### Tutorial

- id
- slug
- animationEntryId
- title
- difficulty
- estimatedMinutes
- prerequisites
- content
- status

### ValidationRun

- id
- targetType
- targetId
- validatorVersion
- deterministicResults
- agentAssessment
- score
- result: pass, fail, warning
- failureCodes
- evidence
- createdAt

### ReviewDecision

- id
- targetType
- targetId
- decision: approve, reject, needs-edit, unpublish
- note
- changes
- createdAt

초기에는 reviewerId가 필요하지 않다. 관리자는 소유자 한 명이다.

### AnonymousEvent

- id 또는 집계 버킷
- eventType
- contentId
- searchTerms
- interpretedFilters
- occurredAt

개인 식별 정보, 이메일과 사용자 프로필은 저장하지 않는다.

## 3. 중복 키

중복 판정은 다음 순서로 수행한다.

1. CodePen canonical URL
2. 정규화한 원본 URL
3. 작성자와 원본 제목
4. 코드 또는 구조 fingerprint
5. 관리자 판단

자동 판정이 불확실하면 병합하지 않고 `possible duplicate` 상태로 보낸다.

## 4. 버전 규칙

- 코드 패키지는 덮어쓰지 않고 새 버전을 만든다.
- 공개 버전 변경에는 ValidationRun과 ReviewDecision이 필요하다.
- 태그 자동 변경은 confirmed 태그를 덮어쓰지 않는다.
- 원본 접근 실패가 발생해도 내부 제작 코드 패키지는 유지한다.
- 공개 중지 후에도 검증과 결정 이력은 삭제하지 않는다.
