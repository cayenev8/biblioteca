// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================

const SUPABASE_URL = "https://vbtipvmzylabtnrmcfrv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nhg9DPIdt8zNQknolLyZIg_7t63u4Dt";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==========================================
// CONTROLE DE NAVEGAÇÃO ENTRE SEÇÕES
// ==========================================

function mostrarSecao(secao) {
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeSection = document.getElementById(secao);

    if (activeSection) {
        activeSection.classList.add("active");
    }

    const activeBtn = Array.from(
        document.querySelectorAll(".nav-item")
    ).find(btn => {
        const onclick = btn.getAttribute("onclick");
        return onclick && onclick.includes(secao);
    });

    if (activeBtn) {
        activeBtn.classList.add("active");
    }
}


// ==========================================
// FORMATAR DATA
// AAAA-MM-DD -> DD/MM/AAAA
// ==========================================

function formatarData(data) {
    if (!data) {
        return "Não informado";
    }

    const partes = data.split("-");

    return partes.length === 3
        ? `${partes[2]}/${partes[1]}/${partes[0]}`
        : data;
}


// ==========================================
// LIVROS: CARREGAR LISTA
// ==========================================

async function carregarLivros() {
    const lista = document.getElementById("listaLivros");

    if (!lista) return;

    const { data, error } = await supabaseClient
        .from("livros")
        .select("*")
        .order("titulo", { ascending: true });

    if (error) {
        console.error("Erro ao carregar livros:", error);

        lista.innerHTML = `
            <p class="mensagem">
                Erro ao carregar os livros.
            </p>
        `;

        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum livro cadastrado.
            </p>
        `;

        atualizarSelectLivros([]);
        return;
    }

    lista.innerHTML = data.map(livro => `
        <div class="item-card">
            <div>
                <h4>📖 ${livro.titulo}</h4>

                <p>
                    <small>
                        Autor: ${livro.autor || "Não informado"}
                        (${livro.ano || "Não informado"})
                    </small>
                </p>

                <span class="badge ${
                    livro.disponivel
                        ? "badge-success"
                        : "badge-danger"
                }">
                    ${
                        livro.disponivel
                            ? "Disponível"
                            : "Emprestado"
                    }
                </span>
            </div>

            ${
                livro.disponivel
                    ? `
                        <button
                            class="btn btn-danger"
                            onclick="excluirLivro(${livro.id})"
                        >
                            Excluir
                        </button>
                    `
                    : ""
            }
        </div>
    `).join("");

    atualizarSelectLivros(data);
}


// ==========================================
// LIVROS: CADASTRAR
// ==========================================

const formLivro = document.getElementById("formLivro");

if (formLivro) {
    formLivro.addEventListener("submit", async function (e) {
        e.preventDefault();

        const titulo = document
            .getElementById("titulo")
            .value
            .trim();

        const autor = document
            .getElementById("autor")
            .value
            .trim();

        const ano = document
            .getElementById("ano")
            .value;

        if (!titulo || !autor) {
            alert("Preencha o título e o autor.");
            return;
        }

        const { error } = await supabaseClient
            .from("livros")
            .insert({
                titulo,
                autor,
                ano: ano ? Number(ano) : null,
                disponivel: true
            });

        if (error) {
            console.error("Erro ao cadastrar livro:", error);
            alert("Erro ao cadastrar o livro.");
            return;
        }

        alert("Livro cadastrado com sucesso!");

        this.reset();

        await carregarLivros();
    });
}


// ==========================================
// LIVROS: EXCLUIR
// ==========================================

async function excluirLivro(id) {
    if (!confirm("Deseja realmente excluir este livro?")) {
        return;
    }

    const { data: emprestimos, error: erroEmprestimos } =
        await supabaseClient
            .from("emprestimos")
            .select("id")
            .eq("livro_id", id);

    if (erroEmprestimos) {
        console.error(
            "Erro ao verificar empréstimos:",
            erroEmprestimos
        );

        alert("Não foi possível verificar o histórico do livro.");
        return;
    }

    if (emprestimos && emprestimos.length > 0) {
        alert(
            "Este livro possui histórico de empréstimos e não pode ser excluído."
        );

        return;
    }

    const { error } = await supabaseClient
        .from("livros")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir livro:", error);
        alert("Erro ao excluir o livro.");
        return;
    }

    alert("Livro excluído com sucesso!");

    await carregarLivros();
}


// ==========================================
// USUÁRIOS: CARREGAR LISTA
// ==========================================

async function carregarUsuarios() {
    const lista = document.getElementById("listaUsuarios");

    if (!lista) return;

    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar usuários:", error);

        lista.innerHTML = `
            <p class="mensagem">
                Erro ao carregar os usuários.
            </p>
        `;

        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum usuário cadastrado.
            </p>
        `;

        atualizarSelectUsuarios([]);
        return;
    }

    lista.innerHTML = data.map(usuario => `
        <div class="item-card">
            <div>
                <h4>👤 ${usuario.nome}</h4>

                <p>
                    <small>
                        ${usuario.email || "Sem e-mail"}
                    </small>
                </p>
            </div>

            <button
                class="btn btn-danger"
                onclick="excluirUsuario(${usuario.id})"
            >
                Excluir
            </button>
        </div>
    `).join("");

    atualizarSelectUsuarios(data);
}


// ==========================================
// USUÁRIOS: CADASTRAR
// ==========================================

const formUsuario = document.getElementById("formUsuario");

if (formUsuario) {
    formUsuario.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nome = document
            .getElementById("nome")
            .value
            .trim();

        const email = document
            .getElementById("email")
            .value
            .trim();

        if (!nome) {
            alert("Digite o nome do usuário.");
            return;
        }

        const { error } = await supabaseClient
            .from("usuarios")
            .insert({
                nome,
                email: email || null
            });

        if (error) {
            console.error("Erro ao cadastrar usuário:", error);
            alert("Erro ao cadastrar usuário.");
            return;
        }

        alert("Usuário cadastrado com sucesso!");

        this.reset();

        await carregarUsuarios();
    });
}


// ==========================================
// USUÁRIOS: EXCLUIR
// ==========================================

async function excluirUsuario(id) {
    if (!confirm("Deseja realmente excluir este usuário?")) {
        return;
    }

    const {
        data: emprestimos,
        error: erroEmprestimos
    } = await supabaseClient
        .from("emprestimos")
        .select("id")
        .eq("usuario_id", id);

    if (erroEmprestimos) {
        console.error(
            "Erro ao verificar empréstimos:",
            erroEmprestimos
        );

        alert("Não foi possível verificar o histórico do usuário.");
        return;
    }

    if (emprestimos && emprestimos.length > 0) {
        alert(
            "Este usuário possui histórico de empréstimos e não pode ser excluído."
        );

        return;
    }

    const { error } = await supabaseClient
        .from("usuarios")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao excluir o usuário.");
        return;
    }

    alert("Usuário excluído com sucesso!");

    await carregarUsuarios();
}


// ==========================================
// SELETORES DO FORMULÁRIO DE EMPRÉSTIMO
// ==========================================

function atualizarSelectLivros(livros) {
    const select = document.getElementById("livroEmprestimo");

    if (!select) return;

    const livrosDisponiveis = livros.filter(
        livro => livro.disponivel
    );

    select.innerHTML = `
        <option value="">
            Selecione um livro...
        </option>

        ${
            livrosDisponiveis
                .map(livro => `
                    <option value="${livro.id}">
                        ${livro.titulo} - ${livro.autor}
                    </option>
                `)
                .join("")
        }
    `;
}


function atualizarSelectUsuarios(usuarios) {
    const select = document.getElementById("usuarioEmprestimo");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Selecione um usuário...
        </option>

        ${
            usuarios
                .map(usuario => `
                    <option value="${usuario.id}">
                        ${usuario.nome}
                    </option>
                `)
                .join("")
        }
    `;
}


// ==========================================
// EMPRÉSTIMOS: REGISTRAR
// ==========================================

const formEmprestimo = document.getElementById("formEmprestimo");

if (formEmprestimo) {
    formEmprestimo.addEventListener(
        "submit",
        async function (e) {
            e.preventDefault();

            const livro_id = Number(
                document.getElementById("livroEmprestimo").value
            );

            const usuario_id = Number(
                document.getElementById("usuarioEmprestimo").value
            );

            if (!livro_id || !usuario_id) {
                alert("Selecione o livro e o usuário.");
                return;
            }

            // Verifica novamente se o livro ainda está disponível
            const {
                data: livro,
                error: erroLivro
            } = await supabaseClient
                .from("livros")
                .select("id, disponivel")
                .eq("id", livro_id)
                .single();

            if (erroLivro || !livro) {
                alert("Não foi possível verificar o livro.");
                return;
            }

            if (!livro.disponivel) {
                alert("Este livro não está mais disponível.");
                await carregarLivros();
                return;
            }

            const {
                error: erroEmprestimo
            } = await supabaseClient
                .from("emprestimos")
                .insert({
                    livro_id,
                    usuario_id,
                    data_emprestimo:
                        new Date()
                            .toISOString()
                            .split("T")[0],
                    devolvido: false
                });

            if (erroEmprestimo) {
                console.error(
                    "Erro ao registrar empréstimo:",
                    erroEmprestimo
                );

                alert("Erro ao registrar empréstimo.");
                return;
            }

            const {
                error: erroAtualizacao
            } = await supabaseClient
                .from("livros")
                .update({
                    disponivel: false
                })
                .eq("id", livro_id);

            if (erroAtualizacao) {
                console.error(
                    "Erro ao atualizar disponibilidade:",
                    erroAtualizacao
                );

                alert(
                    "O empréstimo foi registrado, mas houve um erro ao atualizar a disponibilidade do livro."
                );

                await carregarEmprestimos();
                return;
            }

            alert("Empréstimo registrado com sucesso!");

            this.reset();

            await carregarLivros();
            await carregarEmprestimos();
        }
    );
}


// ==========================================
// EMPRÉSTIMOS: CARREGAR LISTA
// ==========================================

async function carregarEmprestimos() {
    const lista = document.getElementById("listaEmprestimos");

    if (!lista) return;

    const {
        data,
        error
    } = await supabaseClient
        .from("emprestimos")
        .select(`
            id,
            livro_id,
            usuario_id,
            data_emprestimo,
            data_devolucao,
            devolvido,
            livros (
                titulo
            ),
            usuarios (
                nome
            )
        `)
        .order("data_emprestimo", {
            ascending: false
        });

    if (error) {
        console.error(
            "Erro ao carregar empréstimos:",
            error
        );

        lista.innerHTML = `
            <p class="mensagem">
                Erro ao carregar os empréstimos.
            </p>
        `;

        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum empréstimo registrado.
            </p>
        `;

        return;
    }

    lista.innerHTML = data.map(emprestimo => `
        <div class="item-card">

            <div>
                <h4>
                    📖
                    ${emprestimo.livros?.titulo || "Desconhecido"}
                </h4>

                <p>
                    <small>
                        Usuário:
                        ${emprestimo.usuarios?.nome || "Desconhecido"}
                    </small>
                </p>

                <p>
                    <small>
                        Empréstimo:
                        ${formatarData(
                            emprestimo.data_emprestimo
                        )}
                    </small>
                </p>

                ${
                    emprestimo.data_devolucao
                        ? `
                            <p>
                                <small>
                                    Devolução:
                                    ${formatarData(
                                        emprestimo.data_devolucao
                                    )}
                                </small>
                            </p>
                        `
                        : ""
                }

                <span class="badge ${
                    emprestimo.devolvido
                        ? "badge-success"
                        : "badge-danger"
                }">
                    ${
                        emprestimo.devolvido
                            ? "Devolvido"
                            : "Em aberto"
                    }
                </span>
            </div>

            ${
                !emprestimo.devolvido
                    ? `
                        <button
                            class="btn btn-action"
                            onclick="devolverLivro(
                                ${emprestimo.id},
                                ${emprestimo.livro_id}
                            )"
                        >
                            Registrar Devolução
                        </button>
                    `
                    : ""
            }

        </div>
    `).join("");
}


// ==========================================
// EMPRÉSTIMOS: DEVOLVER LIVRO
// ==========================================

async function devolverLivro(emprestimoId, livroId) {
    if (!confirm(
        "Deseja registrar a devolução deste livro?"
    )) {
        return;
    }

    const {
        error: erroEmprestimo
    } = await supabaseClient
        .from("emprestimos")
        .update({
            devolvido: true,
            data_devolucao:
                new Date()
                    .toISOString()
                    .split("T")[0]
        })
        .eq("id", emprestimoId);

    if (erroEmprestimo) {
        console.error(
            "Erro ao registrar devolução:",
            erroEmprestimo
        );

        alert("Erro ao registrar devolução.");
        return;
    }

    const {
        error: erroLivro
    } = await supabaseClient
        .from("livros")
        .update({
            disponivel: true
        })
        .eq("id", livroId);

    if (erroLivro) {
        console.error(
            "Erro ao atualizar livro:",
            erroLivro
        );

        alert(
            "A devolução foi registrada, mas houve um erro ao atualizar o livro."
        );

        await carregarEmprestimos();
        return;
    }

    alert("Devolução registrada com sucesso!");

    await carregarLivros();
    await carregarEmprestimos();
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    mostrarSecao("livros");

    await carregarLivros();
    await carregarUsuarios();
    await carregarEmprestimos();

});