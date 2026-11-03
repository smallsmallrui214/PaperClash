export type Conference = {
  id: string;
  shortName: string;
  fullName: string;
  /** Official CCF directory or conference organizer reference. */
  url: string;
};
export type ConferenceGroup = { id: string; label: string; conferences: Conference[] };

// Names checked against CCF subject directories and the linked organizers on 2026-11-03.
// These are convenient venue filters, not a ranking or a claim that every entry is CCF A.
const ccf = 'https://www.ccf.org.cn/Academic_Evaluation/';
const ai = `${ccf}AI/`;
const software = `${ccf}TCSE_SS_PDL/`;
const data = `${ccf}DM_CS/`;
const security = `${ccf}NIS/`;

export const conferenceGroups: ConferenceGroup[] = [
  {
    id: 'ai-ml', label: '人工智能与机器学习', conferences: [
      { id: 'neurips', shortName: 'NeurIPS', fullName: 'Conference on Neural Information Processing Systems', url: ai },
      { id: 'icml', shortName: 'ICML', fullName: 'International Conference on Machine Learning', url: ai },
      { id: 'iclr', shortName: 'ICLR', fullName: 'International Conference on Learning Representations', url: 'https://iclr.cc/' },
      { id: 'aaai', shortName: 'AAAI', fullName: 'AAAI Conference on Artificial Intelligence', url: ai },
      { id: 'ijcai', shortName: 'IJCAI', fullName: 'International Joint Conference on Artificial Intelligence', url: ai },
    ],
  },
  {
    id: 'vision', label: '计算机视觉', conferences: [
      { id: 'cvpr', shortName: 'CVPR', fullName: 'IEEE/CVF Conference on Computer Vision and Pattern Recognition', url: ai },
      { id: 'iccv', shortName: 'ICCV', fullName: 'IEEE/CVF International Conference on Computer Vision', url: ai },
      { id: 'eccv', shortName: 'ECCV', fullName: 'European Conference on Computer Vision', url: ai },
    ],
  },
  {
    id: 'nlp', label: '自然语言处理', conferences: [
      { id: 'acl', shortName: 'ACL', fullName: 'Annual Meeting of the Association for Computational Linguistics', url: ai },
      { id: 'emnlp', shortName: 'EMNLP', fullName: 'Conference on Empirical Methods in Natural Language Processing', url: ai },
      { id: 'naacl', shortName: 'NAACL', fullName: 'Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies', url: ai },
    ],
  },
  {
    id: 'data', label: '数据库、挖掘与检索', conferences: [
      { id: 'sigmod', shortName: 'SIGMOD', fullName: 'ACM SIGMOD International Conference on Management of Data', url: data },
      { id: 'vldb', shortName: 'VLDB', fullName: 'International Conference on Very Large Data Bases', url: data },
      { id: 'kdd', shortName: 'KDD', fullName: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining', url: data },
      { id: 'sigir', shortName: 'SIGIR', fullName: 'International ACM SIGIR Conference on Research and Development in Information Retrieval', url: data },
      { id: 'icde', shortName: 'ICDE', fullName: 'IEEE International Conference on Data Engineering', url: data },
    ],
  },
  {
    id: 'systems', label: '系统、网络与体系结构', conferences: [
      { id: 'sosp', shortName: 'SOSP', fullName: 'ACM Symposium on Operating Systems Principles', url: software },
      { id: 'osdi', shortName: 'OSDI', fullName: 'USENIX Symposium on Operating Systems Design and Implementation', url: software },
      { id: 'nsdi', shortName: 'NSDI', fullName: 'USENIX Symposium on Networked Systems Design and Implementation', url: `${ccf}CN/` },
      { id: 'sigcomm', shortName: 'SIGCOMM', fullName: 'ACM SIGCOMM Conference on Applications, Technologies, Architectures, and Protocols for Computer Communication', url: `${ccf}CN/` },
      { id: 'isca', shortName: 'ISCA', fullName: 'International Symposium on Computer Architecture', url: `${ccf}ARCH_DCP_SS/` },
      { id: 'micro', shortName: 'MICRO', fullName: 'IEEE/ACM International Symposium on Microarchitecture', url: `${ccf}ARCH_DCP_SS/` },
    ],
  },
  {
    id: 'security', label: '网络与信息安全', conferences: [
      { id: 'ieee-sp', shortName: 'IEEE S&P', fullName: 'IEEE Symposium on Security and Privacy', url: security },
      { id: 'usenix-security', shortName: 'USENIX Security', fullName: 'USENIX Security Symposium', url: security },
      { id: 'ccs', shortName: 'CCS', fullName: 'ACM SIGSAC Conference on Computer and Communications Security', url: security },
      { id: 'ndss', shortName: 'NDSS', fullName: 'Network and Distributed System Security Symposium', url: security },
    ],
  },
  {
    id: 'software', label: '软件工程', conferences: [
      { id: 'icse', shortName: 'ICSE', fullName: 'IEEE/ACM International Conference on Software Engineering', url: software },
      { id: 'fse', shortName: 'FSE', fullName: 'ACM International Conference on the Foundations of Software Engineering', url: software },
      { id: 'ase', shortName: 'ASE', fullName: 'IEEE/ACM International Conference on Automated Software Engineering', url: software },
    ],
  },
  {
    id: 'languages', label: '程序设计语言', conferences: [
      { id: 'pldi', shortName: 'PLDI', fullName: 'ACM SIGPLAN Conference on Programming Language Design and Implementation', url: software },
      { id: 'popl', shortName: 'POPL', fullName: 'ACM SIGPLAN Symposium on Principles of Programming Languages', url: software },
      { id: 'oopsla', shortName: 'OOPSLA', fullName: 'ACM SIGPLAN Conference on Object-Oriented Programming, Systems, Languages, and Applications', url: software },
    ],
  },
  {
    id: 'hci-graphics', label: '人机交互与图形学', conferences: [
      { id: 'chi', shortName: 'CHI', fullName: 'ACM CHI Conference on Human Factors in Computing Systems', url: 'https://sigchi.org/conferences/' },
      { id: 'uist', shortName: 'UIST', fullName: 'ACM Symposium on User Interface Software and Technology', url: 'https://sigchi.org/conferences/' },
      { id: 'siggraph', shortName: 'SIGGRAPH', fullName: 'ACM SIGGRAPH Conference on Computer Graphics and Interactive Techniques', url: 'https://www.siggraph.org/siggraph-events/conferences/' },
    ],
  },
  {
    id: 'theory', label: '计算机理论与算法', conferences: [
      { id: 'stoc', shortName: 'STOC', fullName: 'ACM Symposium on Theory of Computing', url: `${ccf}TCS/` },
      { id: 'focs', shortName: 'FOCS', fullName: 'IEEE Symposium on Foundations of Computer Science', url: `${ccf}TCS/` },
      { id: 'soda', shortName: 'SODA', fullName: 'ACM-SIAM Symposium on Discrete Algorithms', url: `${ccf}TCS/` },
    ],
  },
];

export const conferences = conferenceGroups.flatMap(group => group.conferences);
export const MAX_CONFERENCES = 12;
export const conferenceById = new Map(conferences.map(conference => [conference.id, conference]));
