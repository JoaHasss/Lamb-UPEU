package pe.edu.upeu.lamb.matricula.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pe.edu.upeu.lamb.matricula.dto.MatriculaRequest;
import pe.edu.upeu.lamb.matricula.dto.SeccionDisponibleDto;
import pe.edu.upeu.lamb.matricula.entity.DetalleMatricula;
import pe.edu.upeu.lamb.matricula.entity.EstadoMatricula;
import pe.edu.upeu.lamb.matricula.entity.Matricula;
import pe.edu.upeu.lamb.matricula.exception.BusinessRuleException;
import pe.edu.upeu.lamb.matricula.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.matricula.mapper.MatriculaMapper;
import pe.edu.upeu.lamb.matricula.messaging.MatriculaEventosProducer;
import pe.edu.upeu.lamb.matricula.repository.CondicionMatriculaRepository;
import pe.edu.upeu.lamb.matricula.repository.MatriculaRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MatriculaServiceTest {

    private MatriculaRepository repo;
    private MatriculaMapper mapper;
    private MatriculaEventosProducer producer;
    private PlanificacionConsultaService planificacion;
    private MatriculaService servicio;

    @BeforeEach
    void setUp() {
        repo = mock(MatriculaRepository.class);
        mapper = mock(MatriculaMapper.class);
        producer = mock(MatriculaEventosProducer.class);
        planificacion = mock(PlanificacionConsultaService.class);
        servicio = new MatriculaService(repo, mapper, producer, planificacion, mock(CondicionMatriculaRepository.class));
        when(repo.save(any())).thenAnswer(i -> {
            Matricula m = i.getArgument(0);
            if (m.getId() == null) {
                m.setId(10L);
            }
            return m;
        });
    }

    private Matricula matricula(EstadoMatricula estado, long... secciones) {
        List<DetalleMatricula> detalles = new ArrayList<>();
        for (long s : secciones) {
            detalles.add(DetalleMatricula.builder().idSeccion(s).creditos(4).build());
        }
        return Matricula.builder().idPersona(1L).periodo("2026-2").estado(estado).detalles(detalles).build();
    }

    private SeccionDisponibleDto seccion(String estado) {
        return SeccionDisponibleDto.builder().id(1L).estado(estado).cupoMaximo(30).build();
    }

    @Test
    void crearConSeccionAbiertaRegistraYPublicaEvento() {
        MatriculaRequest req = new MatriculaRequest();
        Matricula m = matricula(null, 5L);
        when(mapper.toEntity(req)).thenReturn(m);
        when(planificacion.obtenerSeccion(5L)).thenReturn(seccion("ABIERTO"));

        servicio.crear(req);

        assertThat(m.getEstado()).isEqualTo(EstadoMatricula.REGISTRADA);
        verify(repo).save(m);
        verify(producer).publicarTrasCommit(any());
    }

    @Test
    void crearConSeccionCerradaSeRechazaSinGuardar() {
        MatriculaRequest req = new MatriculaRequest();
        when(mapper.toEntity(req)).thenReturn(matricula(null, 5L));
        when(planificacion.obtenerSeccion(5L)).thenReturn(seccion("CERRADO"));

        assertThatThrownBy(() -> servicio.crear(req)).isInstanceOf(BusinessRuleException.class);
        verify(repo, never()).save(any());
        verify(producer, never()).publicarTrasCommit(any());
    }

    @Test
    void crearConPlanificacionCaidaRegistraIgual() {
        MatriculaRequest req = new MatriculaRequest();
        Matricula m = matricula(null, 5L);
        when(mapper.toEntity(req)).thenReturn(m);
        when(planificacion.obtenerSeccion(5L)).thenReturn(null);

        servicio.crear(req);

        verify(repo).save(m);
    }

    @Test
    void confirmarDesdeRegistrada() {
        Matricula m = matricula(EstadoMatricula.REGISTRADA);
        when(repo.findById(1L)).thenReturn(Optional.of(m));
        servicio.confirmar(1L);
        assertThat(m.getEstado()).isEqualTo(EstadoMatricula.CONFIRMADA);
    }

    @Test
    void confirmarEsIdempotenteYNoReviveAnulada() {
        Matricula confirmada = matricula(EstadoMatricula.CONFIRMADA);
        Matricula anulada = matricula(EstadoMatricula.ANULADA);
        when(repo.findById(1L)).thenReturn(Optional.of(confirmada));
        when(repo.findById(2L)).thenReturn(Optional.of(anulada));

        servicio.confirmar(1L);
        servicio.confirmar(2L);

        assertThat(confirmada.getEstado()).isEqualTo(EstadoMatricula.CONFIRMADA);
        assertThat(anulada.getEstado()).isEqualTo(EstadoMatricula.ANULADA);
        verify(repo, never()).save(any());
    }

    @Test
    void anularCambiaEstadoYEsIdempotente() {
        Matricula m = matricula(EstadoMatricula.CONFIRMADA);
        when(repo.findById(1L)).thenReturn(Optional.of(m));
        servicio.anular(1L);
        servicio.anular(1L);
        assertThat(m.getEstado()).isEqualTo(EstadoMatricula.ANULADA);
        verify(repo).save(m);
    }

    @Test
    void estudianteNoVeMatriculaAjena() {
        when(repo.findById(1L)).thenReturn(Optional.of(matricula(EstadoMatricula.REGISTRADA)));
        assertThatThrownBy(() -> servicio.obtener(1L, 99L, false)).isInstanceOf(ResourceNotFoundException.class);
    }
}
